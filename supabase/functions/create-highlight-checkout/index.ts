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
    const origin = "http://localhost:8081" // Sua porta confirmada

    const preferenceData = {
      items: [{
        title: "Destaque de Anúncio - Uhome",
        unit_price: 29.90,
        quantity: 1,
        currency_id: "BRL"
      }],
      external_reference: String(pId),
      back_urls: {
        success: `${origin}/my-properties`,
        failure: `${origin}/my-properties`,
        pending: `${origin}/my-properties`
      }
      // auto_return REMOVIDO: Isso permite que o Mercado Pago aceite o localhost
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
    console.error('ERRO CRÍTICO:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})