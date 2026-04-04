import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type NotifyPayload = {
  propertyId?: string;
  property_id?: string;
  status?: "approved" | "rejected";
  rejectionReason?: string | null;
  rejection_reason?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração ausente: RESEND_API_KEY" }),
        { status: 500, headers: corsHeaders },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração ausente: credenciais do Supabase" }),
        { status: 500, headers: corsHeaders },
      );
    }

    // Cliente admin para leitura sem bloqueio de RLS.
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization bearer token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.slice(7).trim();
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: requesterProfile, error: requesterProfileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (requesterProfileError || requesterProfile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const payload = (await req.json()) as NotifyPayload;
    const nextStatus = payload.status;
    if (nextStatus !== "approved" && nextStatus !== "rejected") {
      return new Response(JSON.stringify({ error: "Invalid status" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const propertyId = payload.propertyId ?? payload.property_id;
    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: "property_id não encontrado no payload." }),
        { status: 400, headers: corsHeaders },
      );
    }

    const { data: propertyData, error: propertyError } = await supabaseAdmin
      .from("properties")
      .select("owner_email, title, rejection_reason")
      .eq("id", propertyId)
      .single();

    if (propertyError) {
      console.error("Erro ao consultar imóvel para notificação:", propertyError.message);
      return new Response(
        JSON.stringify({ error: "Não foi possível buscar os dados do proprietário." }),
        { status: 500, headers: corsHeaders },
      );
    }

    const ownerEmail = propertyData?.owner_email?.trim()?.toLowerCase();
    if (!ownerEmail) {
      return new Response(
        JSON.stringify({ error: "E-mail do proprietário não encontrado no banco de dados" }),
        { status: 422, headers: corsHeaders },
      );
    }

    const propertyName = escapeHtml(propertyData?.title ?? "seu imóvel");
    const rejectionReason = escapeHtml(
      (payload.rejectionReason ?? payload.rejection_reason ?? propertyData?.rejection_reason ?? "Não especificado") ||
      "Não especificado",
    );

    let subject = "";
    let htmlTemplate = "";

    if (nextStatus === "approved") {
      subject = "🎉 Seu imóvel foi aprovado no UHOME!";
      htmlTemplate = `<h2>Excelente notícia!</h2><p>O seu anúncio para <strong>${propertyName}</strong> foi aprovado.</p>`;
    } else if (nextStatus === "rejected") {
      subject = "⚠️ Ajustes necessários no seu anúncio do UHOME";
      htmlTemplate = `<h2>Olá, precisamos de alguns ajustes.</h2><p>O anúncio do imóvel <strong>${propertyName}</strong> foi reprovado.</p><p>Motivo: ${rejectionReason}</p>`;
    }

    console.log(`Tentando enviar e-mail para ${ownerEmail}...`);

    // Dispara o e-mail via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Uhome <contato@uhome.app.br>", // Remetente obrigatório para contas gratuitas
        to: ownerEmail,
        subject: subject,
        html: htmlTemplate,
      }),
    });

    // LÊ A RESPOSTA EXATA DO RESEND
    const resData = await res.json();

    if (!res.ok) {
      console.error("❌ O RESEND RECUSOU O ENVIO:", resData);
      return new Response(JSON.stringify({ error: resData }), { status: 400, headers: corsHeaders });
    }

    console.log("✅ E-MAIL ACEITO PELO RESEND:", resData);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ ERRO INTERNO:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
});