import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const pId = body.propertyId || body.property_id
    if (!pId) throw new Error("ID do imóvel ausente")

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const origin = "http://localhost:8081" // Sua porta correta
    const notificationUrl = supabaseUrl
      ? `${supabaseUrl}/functions/v1/mercadopago-webhook`
      : undefined

    const preferenceData = {
      items: [{
        title: "Destaque de Anúncio - Uhome",
        unit_price: 1.00,
        quantity: 1,
        currency_id: "BRL"
      }],
      external_reference: String(pId),
      metadata: {
        property_id: String(pId)
      },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      back_urls: {
        success: "https://uhome.app.br/my-properties",
        failure: "https://uhome.app.br/my-properties",
        pending: "https://uhome.app.br/my-properties"
      }
      // auto_return removido para evitar erros com localhost
    }

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
      throw new Error(data.message || 'Erro na API')
    }

    return new Response(JSON.stringify({ url: data.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const msg = (error as Error).message ?? 'Erro desconhecido';
    console.error('ERRO CRÍTICO:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})