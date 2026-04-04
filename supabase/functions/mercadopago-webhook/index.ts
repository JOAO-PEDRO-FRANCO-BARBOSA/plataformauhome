import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const responseHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

interface MercadoPagoWebhookBody {
  data?: {
    id?: string | number;
  };
  id?: string | number;
}

interface MercadoPagoPaymentResponse {
  status?: string;
  external_reference?: string | number;
  date_approved?: string;
  money_release_date?: string;
  metadata?: {
    property_id?: string | number;
    propertyId?: string | number;
    imovel_id?: string | number;
  };
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

function parseMercadoPagoSignature(signatureHeader: string): { ts: string; v1: string } | null {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const ts = parts.find((part) => part.startsWith("ts="))?.slice(3);
  const v1 = parts.find((part) => part.startsWith("v1="))?.slice(3);

  if (!ts || !v1) return null;
  return { ts, v1 };
}

function normalizeString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function extractPaymentId(req: Request, body: MercadoPagoWebhookBody | null): string | null {
  const url = new URL(req.url);

  const queryId =
    normalizeString(url.searchParams.get("data.id")) ??
    normalizeString(url.searchParams.get("id")) ??
    normalizeString(url.searchParams.get("payment_id"));

  const bodyId =
    normalizeString(body?.data?.id) ??
    normalizeString(body?.id);

  return queryId ?? bodyId;
}

function extractPropertyId(payment: MercadoPagoPaymentResponse): string | null {
  return (
    normalizeString(payment.external_reference) ??
    normalizeString(payment.metadata?.property_id) ??
    normalizeString(payment.metadata?.propertyId) ??
    normalizeString(payment.metadata?.imovel_id)
  );
}

async function processWebhook(paymentId: string): Promise<void> {
  const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
  if (!mpAccessToken) {
    console.error("MP_ACCESS_TOKEN não configurado.");
    return;
  }

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${mpAccessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!paymentResponse.ok) {
    const details = await paymentResponse.text();
    console.error(`Erro ao consultar pagamento ${paymentId} no Mercado Pago:`, details);
    return;
  }

  const payment = (await paymentResponse.json()) as MercadoPagoPaymentResponse;

  if (payment.status !== "approved") {
    console.log(`Pagamento ${paymentId} ignorado. Status atual: ${payment.status ?? "desconhecido"}`);
    return;
  }

  const approvedAt = new Date(payment.date_approved || payment.money_release_date || Date.now());
  const hoursElapsed = (Date.now() - approvedAt.getTime()) / (1000 * 60 * 60);
  if (hoursElapsed > 24) {
    console.log(`Pagamento ${paymentId} ignorado. Aprovado há ${Math.round(hoursElapsed)} horas (> 24h) - Replay Attack Prevention.`);
    return;
  }

  const propertyId = extractPropertyId(payment);
  if (!propertyId) {
    console.error(`Pagamento aprovado ${paymentId} sem propertyId em external_reference/metadata.`);
    return;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.");
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const featuredUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin
    .from("properties")
    .update({ featured_until: featuredUntil })
    .eq("id", propertyId);

  if (error) {
    console.error(`Falha ao atualizar destaque do imóvel ${propertyId}:`, error.message);
    return;
  }

  console.log(`Imóvel ${propertyId} atualizado com featured_until=${featuredUntil}.`);
}

async function verifyMercadoPagoSignature(req: Request, paymentId: string, secret: string): Promise<boolean> {
  const signatureHeader = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  const parsed = parseMercadoPagoSignature(signatureHeader);

  if (!parsed || !requestId) return false;

  const manifest = `id:${paymentId};request-id:${requestId};ts:${parsed.ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = toHex(digest);

  return timingSafeEqual(expected, parsed.v1);
}

async function wasEventProcessed(
  supabaseAdmin: ReturnType<typeof createClient>,
  provider: "mercadopago",
  eventId: string,
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("webhook_events")
    .insert({ provider, event_id: eventId });

  if (!error) return false;
  if ((error as { code?: string }).code === "23505") return true;

  throw error;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: responseHeaders,
    });
  }

  let body: MercadoPagoWebhookBody | null = null;

  try {
    const rawBody = await req.text();
    if (rawBody.trim().length > 0) {
      body = JSON.parse(rawBody) as MercadoPagoWebhookBody;
    }
  } catch {
    body = null;
  }

  const paymentId = extractPaymentId(req, body);

  if (!paymentId) {
    return new Response(JSON.stringify({ error: "Missing payment id" }), {
      status: 400,
      headers: responseHeaders,
    });
  }

  try {
    const mpWebhookSecret = Deno.env.get("MP_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!mpWebhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: responseHeaders,
      });
    }

    const isSignatureValid = await verifyMercadoPagoSignature(req, paymentId, mpWebhookSecret);
    if (!isSignatureValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: responseHeaders,
      });
    }

    const eventId = req.headers.get("x-request-id") ?? `payment-${paymentId}`;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const alreadyProcessed = await wasEventProcessed(supabaseAdmin, "mercadopago", eventId);
    if (alreadyProcessed) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: responseHeaders,
      });
    }

    await processWebhook(paymentId);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erro no webhook Mercado Pago:", message);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: responseHeaders,
    });
  }
});
