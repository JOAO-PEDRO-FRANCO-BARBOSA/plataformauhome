import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'npm:stripe@^14.16.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

// Força o Stripe a usar o Fetch (compatível com Deno)
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Provedor de criptografia nativo do Deno para validar a assinatura do Webhook
const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  try {
    // IMPORTANTE: Webhooks precisam ler o texto cru (raw), não um JSON direto
    const body = await req.text(); 
    
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature!,
        webhookSecret!,
        undefined,
        cryptoProvider // Isso impede o erro de "crypto is not defined" no Deno
      );
    } catch (err: any) {
      console.error(`❌ Falha na verificação de segurança do Stripe:`, err.message);
      return new Response(err.message, { status: 400 });
    }

    // Se o evento for de pagamento concluído
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const propertyId = session.metadata?.property_id;

      if (propertyId) {
         console.log(`✅ Pagamento confirmado para o imóvel: ${propertyId}`);
         
         // Cria o cliente Supabase com a chave de administrador (Service Role) 
         // para ter permissão de alterar a tabela por baixo dos panos
         const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
         );

         // Adiciona 7 dias a partir de agora
         const featuredUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

         const { error } = await supabaseAdmin
          .from('properties')
          .update({ featured_until: featuredUntil })
          .eq('id', propertyId);

         if (error) {
             console.error("❌ Erro ao atualizar o banco:", error);
             throw error;
         }
         console.log(`🌟 Imóvel destacado com sucesso até ${featuredUntil}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (err: any) {
    console.error("❌ Erro interno no webhook:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});