import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "https://www.faceafrica.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  const json = await req.json().catch(() => null);
  const castingId = typeof json?.castingId === "string" ? json.castingId : "";
  if (!castingId) return Response.json({ error: "castingId is required" }, { status: 400, headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
  if (!supabaseUrl || !anonKey) return Response.json({ error: "Email service is not configured" }, { status: 503, headers: corsHeaders });
  if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.email) return Response.json({ error: "A verified session and email are required" }, { status: 401, headers: corsHeaders });

  const { data: profile, error: profileError } = await supabase
    .from("model_profiles").select("id,status").eq("user_id", user.id).maybeSingle();
  if (profileError || !profile || profile.status !== "published") {
    return Response.json({ error: "Published model profile not found" }, { status: 403, headers: corsHeaders });
  }

  const { data: application, error: applicationError } = await supabase
    .from("casting_applications")
    .select("id,status,casting:castings(title)")
    .eq("casting_id", castingId)
    .eq("model_profile_id", profile.id)
    .maybeSingle();
  if (applicationError || !application) return Response.json({ error: "Application not found or access denied" }, { status: 404, headers: corsHeaders });

  if (!resendKey || !fromEmail) {
    return Response.json({ sent: false, reason: "email_provider_not_configured" }, { status: 503, headers: corsHeaders });
  }

  const casting = Array.isArray(application.casting) ? application.casting[0] : application.casting;
  const castingTitle = typeof casting?.title === "string" ? casting.title : "votre casting";
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.faceafrica.com";
  const subject = "FACEAFRICA — candidature bien reçue";
  const text = `Bonjour,

Nous confirmons la bonne réception de votre candidature pour « ${castingTitle} ».

Vous pouvez retrouver son suivi dans votre espace mannequin :
${siteUrl}/espace

Merci de votre confiance,
L’équipe FACEAFRICA`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717"><h2>Votre candidature a bien été reçue</h2><p>Bonjour,</p><p>Nous confirmons la bonne réception de votre candidature pour <strong>${castingTitle.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)}</strong>.</p><p>Retrouvez son suivi dans votre <a href="${siteUrl}/espace">espace mannequin</a>.</p><p>Merci de votre confiance,<br/>L’équipe FACEAFRICA</p></div>`;

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `casting-application-${application.id}`,
    },
    body: JSON.stringify({ from: fromEmail, to: [user.email], subject, text, html }),
  });
  if (!emailResponse.ok) {
    const details = await emailResponse.text();
    console.error("casting_application_email_failed", emailResponse.status, details.slice(0, 500));
    return Response.json({ sent: false, reason: "provider_error" }, { status: 502, headers: corsHeaders });
  }

  return Response.json({ sent: true }, { status: 200, headers: corsHeaders });
});
