import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify user with anon client
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders })
    }

    const userId = claimsData.claims.sub as string

    // Use service role client for deletions
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Delete user's properties
    await adminClient.from('properties').delete().eq('owner_id', userId)

    // Delete user's connections
    await adminClient.from('connections').delete().or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)

    // Delete user's messages
    // Messages are tied to connections which are already deleted, but clean up any orphans
    await adminClient.from('messages').delete().eq('sender_id', userId)

    // Delete profile
    await adminClient.from('profiles').delete().eq('id', userId)

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      return new Response(JSON.stringify({ error: 'Erro ao excluir conta' }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (err) {
    console.error('delete-account error:', err)
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: corsHeaders })
  }
})
