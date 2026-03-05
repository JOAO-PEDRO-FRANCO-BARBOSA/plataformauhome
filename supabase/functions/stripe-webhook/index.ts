// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !stripeWebhookSecret || !supabaseUrl || !serviceRoleKey) {
      return new Response('Missing required environment variables', { status: 500 });
    }

    const stripeSignature = req.headers.get('stripe-signature');
    if (!stripeSignature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });

    const rawBody = await req.text();

    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      stripeSignature,
      stripeWebhookSecret,
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const propertyId = session.metadata?.property_id;

      if (!propertyId) {
        return new Response('Missing property_id metadata', { status: 400 });
      }

      const featuredUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const { error } = await supabaseAdmin
        .from('properties')
        .update({ featured_until: featuredUntil })
        .eq('id', propertyId);

      if (error) {
        console.error('Error updating featured_until:', error);
        return new Response('Database update error', { status: 500 });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('stripe-webhook error:', error);
    return new Response('Webhook Error', { status: 400 });
  }
});
