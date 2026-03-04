import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type PropertyStatus = 'pending' | 'approved' | 'rejected' | string

interface PropertyRow {
  id: string
  owner_id: string
  title: string | null
  status: PropertyStatus | null
}

interface WebhookPayload {
  type?: string
  table?: string
  schema?: string
  record?: PropertyRow
  old_record?: PropertyRow
}

const jsonHeaders = {
  'Content-Type': 'application/json',
}

const getStatusLabel = (status: PropertyStatus | null) => {
  if (status === 'approved') return 'aprovado'
  if (status === 'rejected') return 'rejeitado'
  return 'atualizado'
}

const buildEmailContent = (status: PropertyStatus | null, propertyTitle: string) => {
  if (status === 'approved') {
    return {
      subject: 'Seu anúncio foi aprovado no UHOME 🎉',
      html: `
        <h2>Boa notícia! Seu anúncio foi aprovado.</h2>
        <p>O imóvel <strong>${propertyTitle}</strong> já está online no marketplace da UHOME.</p>
        <p>Agora os estudantes já podem visualizar e reservar o anúncio.</p>
      `,
      text: `Boa notícia! Seu anúncio "${propertyTitle}" foi aprovado e já está online no marketplace da UHOME.`,
    }
  }

  return {
    subject: 'Seu anúncio precisa de ajustes no UHOME',
    html: `
      <h2>Seu anúncio foi rejeitado no momento.</h2>
      <p>O imóvel <strong>${propertyTitle}</strong> precisa de correções para ser publicado.</p>
      <p>Revise as informações e documentos e envie novamente para análise.</p>
    `,
    text: `Seu anúncio "${propertyTitle}" foi rejeitado no momento e precisa de correções para nova análise.`,
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders })
  }

  try {
    const webhookSecret = Deno.env.get('SUPABASE_WEBHOOK_SECRET')
    const providedSecret = req.headers.get('x-webhook-secret')

    if (webhookSecret && providedSecret !== webhookSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized webhook' }), { status: 401, headers: jsonHeaders })
    }

    const payload = (await req.json()) as WebhookPayload

    if (payload.table !== 'properties') {
      return new Response(JSON.stringify({ skipped: true, reason: 'Not properties table' }), { headers: jsonHeaders })
    }

    const newRecord = payload.record
    const oldRecord = payload.old_record

    if (!newRecord?.owner_id || !newRecord?.id) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Missing property identifiers' }), { headers: jsonHeaders })
    }

    if (newRecord.status === oldRecord?.status) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Status not changed' }), { headers: jsonHeaders })
    }

    if (newRecord.status !== 'approved' && newRecord.status !== 'rejected') {
      return new Response(JSON.stringify({ skipped: true, reason: 'Status not notifiable' }), { headers: jsonHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const resendFrom = Deno.env.get('RESEND_FROM_EMAIL')

    if (!supabaseUrl || !serviceRole || !resendApiKey || !resendFrom) {
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
        status: 500,
        headers: jsonHeaders,
      })
    }

    const adminClient = createClient(supabaseUrl, serviceRole)
    const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(newRecord.owner_id)

    if (authError || !authData.user?.email) {
      console.error('Owner email not found', authError)
      return new Response(JSON.stringify({ error: 'Owner email not found' }), { status: 404, headers: jsonHeaders })
    }

    const ownerEmail = authData.user.email
    const propertyTitle = newRecord.title ?? `Imóvel ${newRecord.id}`
    const content = buildEmailContent(newRecord.status, propertyTitle)

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [ownerEmail],
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
    })

    const resendData = await resendResponse.json().catch(() => null)

    if (!resendResponse.ok) {
      console.error('Resend error', resendData)
      return new Response(JSON.stringify({ error: 'Failed to send email', detail: resendData }), {
        status: 502,
        headers: jsonHeaders,
      })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        property_id: newRecord.id,
        status: newRecord.status,
        status_label: getStatusLabel(newRecord.status),
      }),
      { headers: jsonHeaders },
    )
  } catch (error) {
    console.error('notify-property-status error', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})
