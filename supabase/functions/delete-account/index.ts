import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // 1. Liberação do CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    // 2. Extrair o Header de Autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // Variáveis de ambiente automáticas do Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Faltam variáveis de ambiente críticas no servidor.");
    }

    // 3. CLIENTE DO USUÁRIO: Usado APENAS para verificar de quem é o token
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    // Se o token for inválido, paramos aqui
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token de usuário inválido ou expirado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. CLIENTE ADMIN: Usado APENAS para executar a exclusão com superpoderes
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 5. Excluir o usuário (garantimos que ele só deleta a si mesmo porque pegamos o ID do próprio token)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw new Error(deleteError.message || "Erro no banco ao deletar usuário");
    }

    // 6. Sucesso!
    return new Response(JSON.stringify({ success: true, message: "User deleted successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("delete-account error:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 400, // Alterado para 400 para diferenciar dos 401 do Kong no frontend
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});