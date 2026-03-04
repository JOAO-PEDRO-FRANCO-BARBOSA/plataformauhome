import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const payload = await req.json();
    const { record, old_record } = payload;

    // Se o status não mudou, encerra a função
    if (record.status === old_record.status) {
      return new Response("Status inalterado", { status: 200 });
    }

    // AQUI ENTRARIA A BUSCA PELO EMAIL REAL DO USUÁRIO. 
    // Para testarmos agora, coloque O SEU E-MAIL PESSOAL ABAIXO:
    const ownerEmail = "francojoao512@gmail.com"; 

    let subject = "";
    let htmlTemplate = "";

    if (record.status === "approved") {
      subject = "🎉 Seu imóvel foi aprovado no UHOME!";
      htmlTemplate = `
        <h2>Excelente notícia!</h2>
        <p>O seu anúncio para <strong>${record.title}</strong> foi revisado e já está online na plataforma.</p>
        <p>Os estudantes já podem visualizar e entrar em contato.</p>
      `;
    } else if (record.status === "rejected") {
      subject = "⚠️ Ajustes necessários no seu anúncio do UHOME";
      htmlTemplate = `
        <h2>Olá, precisamos de alguns ajustes.</h2>
        <p>O seu anúncio para <strong>${record.title}</strong> foi revisado, mas encontramos um problema:</p>
        <div style="padding: 12px; border-left: 4px solid red; background: #ffe6e6;">
          <strong>Motivo:</strong> ${record.rejection_reason || "Não especificado."}
        </div>
        <p>Por favor, acesse a plataforma, exclua o anúncio pendente e crie um novo com as informações corrigidas.</p>
      `;
    } else {
       return new Response("Status ignorado", { status: 200 });
    }

    // Dispara o e-mail via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "UHOME <onboarding@resend.dev>", 
        to: ownerEmail,
        subject: subject,
        html: htmlTemplate,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});