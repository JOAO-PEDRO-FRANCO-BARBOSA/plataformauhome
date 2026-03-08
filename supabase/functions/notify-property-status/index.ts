import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração ausente: RESEND_API_KEY" }),
        { status: 500 },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração ausente: credenciais do Supabase" }),
        { status: 500 },
      );
    }

    // Cliente admin para leitura sem bloqueio de RLS.
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const payload = await req.json();
    const { record, old_record } = payload;

    // Trava de segurança: se o status não mudou, ele avisa no log e para.
    if (!old_record || record.status === old_record.status) {
      console.log("Status não mudou. Ignorando envio.");
      return new Response("Status inalterado", { status: 200 });
    }

    const propertyId = payload?.propertyId ?? payload?.property_id ?? record?.id;
    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: "property_id não encontrado no payload." }),
        { status: 400 },
      );
    }

    const { data: propertyData, error: propertyError } = await supabaseAdmin
      .from("properties")
      .select("owner_email")
      .eq("id", propertyId)
      .single();

    if (propertyError) {
      console.error("Erro ao consultar imóvel para notificação:", propertyError.message);
      return new Response(
        JSON.stringify({ error: "Não foi possível buscar os dados do proprietário." }),
        { status: 500 },
      );
    }

    const ownerEmail = propertyData?.owner_email?.trim()?.toLowerCase();
    if (!ownerEmail) {
      return new Response(
        JSON.stringify({ error: "E-mail do proprietário não encontrado no banco de dados" }),
        { status: 422 },
      );
    }

    let subject = "";
    let htmlTemplate = "";

    if (record.status === "approved") {
      subject = "🎉 Seu imóvel foi aprovado no UHOME!";
      htmlTemplate = `<h2>Excelente notícia!</h2><p>O seu anúncio para <strong>${record.title}</strong> foi aprovado.</p>`;
    } else if (record.status === "rejected") {
      subject = "⚠️ Ajustes necessários no seu anúncio do UHOME";
      htmlTemplate = `<h2>Olá, precisamos de alguns ajustes.</h2><p>Motivo: ${record.rejection_reason || "Não especificado"}</p>`;
    } else {
      return new Response("Status ignorado", { status: 200 });
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
        from: "onboarding@resend.dev", // Remetente obrigatório para contas gratuitas
        to: ownerEmail,
        subject: subject,
        html: htmlTemplate,
      }),
    });

    // LÊ A RESPOSTA EXATA DO RESEND
    const resData = await res.json();

    if (!res.ok) {
      console.error("❌ O RESEND RECUSOU O ENVIO:", resData);
      return new Response(JSON.stringify({ error: resData }), { status: 400 });
    }

    console.log("✅ E-MAIL ACEITO PELO RESEND:", resData);
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ ERRO INTERNO:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});