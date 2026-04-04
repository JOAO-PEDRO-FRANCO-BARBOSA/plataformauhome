import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const responseHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type StripeEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: {
      metadata?: Record<string, string | undefined>;
      client_reference_id?: string;
      payment_status?: string;
    };
  };
};

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

function parseStripeSignature(signatureHeader: string): { timestamp: string; signatures: string[] } | null {
  const parts = signatureHeader.split(",").map((chunk) => chunk.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean);

  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
}

async function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): Promise<boolean> {
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed) return false;

  const timestampNumber = Number(parsed.timestamp);
  if (!Number.isFinite(timestampNumber)) return false;

  const toleranceSeconds = 5 * 60;
  const age = Math.abs(Math.floor(Date.now() / 1000) - timestampNumber);
  if (age > toleranceSeconds) return false;

  const payload = `${parsed.timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = toHex(digest);

  return parsed.signatures.some((signature) => timingSafeEqual(signature, expected));
}

function getPropertyId(event: StripeEvent): string | null {
  const obj = event.data?.object;
  const metadata = obj?.metadata ?? {};

  return (
    metadata.property_id?.trim() ??
    metadata.propertyId?.trim() ??
    obj?.client_reference_id?.trim() ??
    null
  );
}

async function wasEventProcessed(supabaseAdmin: ReturnType<typeof createClient>, eventId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("webhook_events")
    .insert({ provider: "stripe", event_id: eventId });

  if (!error) return false;
  if ((error as { code?: string }).code === "23505") return true;

  throw error;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: responseHeaders,
    });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecret || !supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: responseHeaders,
      });
    }

    const signatureHeader = req.headers.get("stripe-signature") ?? "";
    const rawBody = await req.text();
    const isValid = await verifyStripeSignature(rawBody, signatureHeader, stripeSecret);

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: responseHeaders,
      });
    }

    const event = JSON.parse(rawBody) as StripeEvent;
    const eventId = event.id?.trim();
    if (!eventId) {
      return new Response(JSON.stringify({ error: "Missing event id" }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const alreadyProcessed = await wasEventProcessed(supabaseAdmin, eventId);
    if (alreadyProcessed) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: responseHeaders,
      });
    }

    if (event.type === "checkout.session.completed") {
      const paymentStatus = event.data?.object?.payment_status;
      if (paymentStatus !== "paid") {
        return new Response(JSON.stringify({ received: true, ignored: true }), {
          status: 200,
          headers: responseHeaders,
        });
      }

      const propertyId = getPropertyId(event);
      if (!propertyId) {
        return new Response(JSON.stringify({ error: "Missing property reference" }), {
          status: 400,
          headers: responseHeaders,
        });
      }

      const featuredUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabaseAdmin
        .from("properties")
        .update({ featured_until: featuredUntil })
        .eq("id", propertyId);

      if (error) {
        throw error;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("stripe-webhook error:", message);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: responseHeaders,
    });
  }
});