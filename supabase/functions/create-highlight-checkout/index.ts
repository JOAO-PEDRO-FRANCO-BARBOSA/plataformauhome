import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    const body = await req.json()
    const pId = body.propertyId || body.property_id
    if (!pId || pId === 'undefined') throw new Error("ID do imóvel inválido ou ausente")

    // 1. Validar o Token do Usuário (Segurança Interna)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado: Token ausente");

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "";
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? "";
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !accessToken) {
        throw new Error("Erro interno: Credenciais de ambiente ausentes");
    }

    // Cliente para validar quem é o usuário
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Sessão inválida ou expirada");

    // 2. Validar se o usuário é o DONO do imóvel
    // Usamos o Service Role para olhar a tabela com garantia
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .select('owner_id')
        .eq('id', pId)
        .single();

    if (propertyError || !property) {
        throw new Error("Imóvel não encontrado no banco de dados.");
    }

    if (property.owner_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Você não tem permissão para destacar um anúncio que não é seu.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403
        });
    }

    // 3. Tudo seguro! Prosseguir com Mercado Pago
    const origin = "https://uhome.app.br" 
    const notificationUrl = supabaseUrl
      ? `${supabaseUrl}/functions/v1/mercadopago-webhook`
      : undefined

    const preferenceData = {
      items: [{
        title: "Destaque de Anúncio - Uhome",
        unit_price: 1.00, // Substitua pelo valor real se necessário (ex: 29.90)
        quantity: 1,
        currency_id: "BRL"
      }],
      external_reference: String(pId || ''),
      metadata: {
        property_id: String(pId)
      },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      back_urls: {
        success: `${origin}/my-properties`,
        failure: `${origin}/my-properties`,
        pending: `${origin}/my-properties`
      }
    }

    console.log("PAYLOAD PARA O MP:", JSON.stringify(preferenceData, null, 2));

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('ERRO MP:', JSON.stringify(data))
      throw new Error(data.message || 'Erro na API do Mercado Pago')
    }

    return new Response(JSON.stringify({ url: data.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    const msg = error.message ?? 'Erro desconhecido';
    console.error('ERRO CRÍTICO:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})