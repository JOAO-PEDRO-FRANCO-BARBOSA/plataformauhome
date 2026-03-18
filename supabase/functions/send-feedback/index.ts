import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
};

type FeedbackPayload = {
	type?: string;
	message?: string;
};

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			...corsHeaders,
			"Content-Type": "application/json",
		},
	});

serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", {
			status: 200,
			headers: corsHeaders,
		});
	}

	if (req.method !== "POST") {
		return jsonResponse({ error: "Método não permitido" }, 405);
	}

	if (!RESEND_API_KEY) {
		return jsonResponse({ error: "Configuração ausente: RESEND_API_KEY" }, 500);
	}

	let payload: FeedbackPayload;
	try {
		payload = await req.json();
	} catch {
		return jsonResponse({ error: "Corpo da requisição inválido" }, 400);
	}

	const type = (payload.type ?? "Outro").trim();
	const message = (payload.message ?? "").trim();

	if (!message) {
		return jsonResponse({ error: "A mensagem é obrigatória" }, 400);
	}

	let senderEmail = "Usuário Anônimo";
	const authHeader = req.headers.get("Authorization");
	const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

	if (token && SUPABASE_URL && SUPABASE_ANON_KEY) {
		try {
			const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
				global: {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			});

			const { data, error } = await supabase.auth.getUser(token);
			if (!error && data.user?.email) {
				senderEmail = data.user.email;
			}
		} catch (error) {
			console.error("Falha ao extrair usuário autenticado:", error);
		}
	}

	const resendResponse = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${RESEND_API_KEY}`,
		},
		body: JSON.stringify({
			from: "Uhome Feedback <contato@uhome.app.br>",
			to: "projetouhome@gmail.com",
			subject: `[Novo Feedback - ${type}] Uhome App`,
			html: `
				<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
					<h2 style="margin:0 0 16px;font-size:20px;color:#4c1d95;">Novo feedback recebido no Uhome</h2>
					<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px;">
						<p style="margin:0 0 8px;"><strong>Tipo:</strong> ${type}</p>
						<p style="margin:0;"><strong>Status do usuário:</strong> ${senderEmail === "Usuário Anônimo" ? "Não autenticado" : "Autenticado"}</p>
					</div>
					<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
						<p style="margin:0 0 8px;"><strong>Mensagem:</strong></p>
						<p style="margin:0;white-space:pre-wrap;">${message}</p>
					</div>
					<p style="margin-top:16px;font-size:12px;color:#6b7280;">Enviado por: ${senderEmail}</p>
				</div>
			`,
		}),
	});

	const resendData = await resendResponse.json().catch(() => ({}));

	if (!resendResponse.ok) {
		return jsonResponse(
			{
				error: "Falha ao enviar feedback por e-mail",
				details: resendData,
			},
			502,
		);
	}

	return jsonResponse({ success: true, message: "Feedback enviado com sucesso" }, 200);
});
