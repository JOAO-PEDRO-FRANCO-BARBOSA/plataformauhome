import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const payload = await req.json();
    const { record, old_record } = payload;

    // Trava de segurança: se o status não mudou, ele avisa no log e para.
    if (!old_record || record.status === old_record.status) {
      console.log("Status não mudou. Ignorando envio.");
      return new Response("Status inalterado", { status: 200 });
    }

    const ownerEmail = "francojoao512@gmail.com"; // Seu e-mail de teste

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

  } catch (error) {
    console.error("❌ ERRO INTERNO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});