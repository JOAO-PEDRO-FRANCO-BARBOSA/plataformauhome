import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'npm:stripe@^14.16.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Lida com a requisição inicial do navegador (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { property_id } = await req.json();

    if (!property_id) {
      throw new Error("ID do imóvel não foi enviado.");
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error("Chave do Stripe não configurada no cofre.");
    }

    // A MÁGICA ESTÁ AQUI: Forçamos o Stripe a usar o Fetch, resolvendo o erro do Deno!
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(), 
    });

    const origin = req.headers.get('origin') || 'http://localhost:8081';

    // Cria o link de pagamento
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: '🌟 Destaque de Anúncio - Uhome',
              description: 'Seu imóvel no topo das buscas por 7 dias.',
            },
            unit_amount: 2990, // R$ 29,90
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/my-properties?success=true`,
      cancel_url: `${origin}/my-properties?canceled=true`,
      metadata: {
        property_id: property_id,
      },
    });

    // Devolve a URL para o frontend redirecionar o usuário
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erro na função:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});