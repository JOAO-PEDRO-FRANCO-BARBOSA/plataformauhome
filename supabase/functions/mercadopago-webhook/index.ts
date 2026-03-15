import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  metadata?: {
    property_id?: string | number;
    propertyId?: string | number;
    imovel_id?: string | number;
  };
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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

  if (paymentId) {
    processWebhook(paymentId).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Erro assíncrono no webhook Mercado Pago:", message);
    });
  } else {
    console.log("Webhook Mercado Pago recebido sem paymentId.");
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
