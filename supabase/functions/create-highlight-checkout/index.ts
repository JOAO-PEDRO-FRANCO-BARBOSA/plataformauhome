// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const appBaseUrl = Deno.env.get('APP_BASE_URL');

    if (!supabaseUrl || !supabaseAnonKey || !stripeSecretKey || !appBaseUrl) {
      return new Response(JSON.stringify({ error: 'Missing required environment variables.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const propertyId = body?.property_id as string | undefined;

    if (!propertyId) {
      return new Response(JSON.stringify({ error: 'property_id is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Invalid user session.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = authData.user.id;

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, owner_id, title')
      .eq('id', propertyId)
      .eq('owner_id', userId)
      .single();

    if (propertyError || !property) {
      return new Response(JSON.stringify({ error: 'Property not found or unauthorized.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: 2990,
            product_data: {
              name: 'Anúncio em Destaque - 7 dias',
              description: property.title,
            },
          },
        },
      ],
      metadata: {
        property_id: property.id,
      },
      success_url: `${appBaseUrl}/my-properties?highlight=success`,
      cancel_url: `${appBaseUrl}/my-properties?highlight=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('create-highlight-checkout error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
