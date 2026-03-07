import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MercadoPagoWebhookBody {
  data?: {
    id?: string | number;
  };
  id?: string | number;
}

interface MercadoPagoPaymentResponse {
  status?: string;
  external_reference?: string;
}

function normalizePaymentId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const queryPaymentId =
      normalizePaymentId(url.searchParams.get('data.id')) ??
      normalizePaymentId(url.searchParams.get('id'));

    let bodyPaymentId: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = (await req.json()) as MercadoPagoWebhookBody;
        bodyPaymentId =
          normalizePaymentId(body?.data?.id) ??
          normalizePaymentId(body?.id);
      } catch {
        // Alguns eventos podem chegar sem JSON válido; seguimos apenas com query params.
      }
    }

    const paymentId = queryPaymentId ?? bodyPaymentId;

    if (!paymentId) {
      console.log('Webhook MP recebido sem paymentId.');
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      console.error('MP_ACCESS_TOKEN não configurado.');
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error(`Falha ao consultar pagamento MP (${paymentId}):`, errorText);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payment = (await paymentResponse.json()) as MercadoPagoPaymentResponse;

    if (payment.status === 'approved') {
      const propertyId = payment.external_reference;

      if (!propertyId) {
        console.error(`Pagamento aprovado sem external_reference (paymentId: ${paymentId}).`);
      } else {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
          console.error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.');
        } else {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
          const featuredUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          const { error } = await supabaseAdmin
            .from('properties')
            .update({ featured_until: featuredUntil })
            .eq('id', propertyId);

          if (error) {
            console.error('Erro ao atualizar featured_until:', error.message);
          } else {
            console.log(`Imóvel ${propertyId} destacado até ${featuredUntil}.`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Erro interno no webhook MP:', message);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});