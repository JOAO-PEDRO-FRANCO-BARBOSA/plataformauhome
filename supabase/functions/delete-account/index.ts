import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Cabeçalho de autorização ausente.');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Token inválido ou expirado.');
    }

    // Cliente Admin com poderes totais
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- INÍCIO DA FAXINA (Evita o erro de Foreign Key) ---
    // 1. Apaga mensagens enviadas
    await supabaseAdmin.from('messages').delete().eq('sender_id', user.id);
    
    // 2. Apaga conexões (seja como remetente ou destinatário)
    await supabaseAdmin.from('connections').delete().or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
    
    // 3. Apaga imóveis cadastrados
    await supabaseAdmin.from('properties').delete().eq('owner_id', user.id);
    
    // 4. Apaga o perfil público
    await supabaseAdmin.from('profiles').delete().eq('id', user.id);
    // --- FIM DA FAXINA ---

    // Agora sim, o banco de dados deixa apagar a conta principal!
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Conta excluída com sucesso.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    console.error("Erro no delete-account:", message); // Fica registrado no log do Supabase
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});