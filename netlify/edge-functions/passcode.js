// Passcode gate for the AI Center Programming Dashboard (Netlify Edge Function).
// Runs before every request, so the page AND data.json are only served after the passcode is entered.
// Only hashes are stored here; the passcode itself is not in this file.
// To change the passcode, ask Copilot to regenerate the two hashes below.
const LOGIN_HASH = "bcfad75d52ac89395fc7b38d628bf94d18a0d72f3a9b47d44c0d067abc84f79f";
const SESSION_CHECK = "944a6f3b86f2d0e9ab138ce596c775a2fce0d10b9526d719063f90c8ccccd9b9";
const COOKIE = "aic_session";
const MAX_AGE = 60 * 60 * 24 * 30; // stay signed in for 30 days

async function sha256(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function same(a, b) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}
function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return "";
}
function safeNext(n) {
  return typeof n === "string" && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/login") ? n : "/";
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function loginPage(message, next, status) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>AI Center Programming Dashboard · Sign in</title>
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%;font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif}
body{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#00225A,#0b1430 70%);padding:20px}
form{background:#fff;color:#0f1b33;border-radius:18px;padding:34px 30px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.35);text-align:center}
.logo{display:inline-flex;width:54px;height:54px;border-radius:14px;background:#00225A;color:#76CEE1;align-items:center;justify-content:center;font-weight:800;font-size:18px}
h1{font-size:22px;margin:12px 0 4px}p{color:#5b6782;margin:0 0 18px;font-size:14px}
input{width:100%;padding:12px 14px;border:1.5px solid #cfd8e8;border-radius:10px;font-size:16px;text-align:center;letter-spacing:.08em}
input:focus{outline:none;border-color:#0a3275;box-shadow:0 0 0 3px rgba(118,206,225,.45)}
button{margin-top:12px;width:100%;padding:12px;border:0;border-radius:10px;background:#00225A;color:#fff;font-weight:600;font-size:15px;cursor:pointer}
button:hover{background:#0a3275}.msg{min-height:20px;margin-top:10px;font-size:13px;color:#d64545}
</style></head><body>
<form method="post" action="/login" autocomplete="off">
<div class="logo">AI</div><h1>AI Center Programming Dashboard</h1><p>FY27 · Teach For America · Enter the passcode to continue</p>
<input name="passcode" type="password" placeholder="Passcode" aria-label="Passcode" autocapitalize="off" autocorrect="off" spellcheck="false" autofocus required>
<input type="hidden" name="next" value="${esc(next)}">
<button type="submit">Unlock dashboard</button><div class="msg" role="alert">${esc(message)}</div>
</form></body></html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });
}

export default async (request) => {
  const url = new URL(request.url);
  if (url.pathname === "/logout") {
    return new Response(null, { status: 303, headers: { location: "/", "cache-control": "no-store",
      "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
  }
  if (url.pathname === "/login" && request.method === "POST") {
    let pass = "", next = "/";
    try { const f = await request.formData(); pass = String(f.get("passcode") || "").trim(); next = safeNext(String(f.get("next") || "/")); } catch (e) { /* bad form */ }
    if (pass && same(await sha256("aic-login-v1:" + pass), LOGIN_HASH)) {
      const token = await sha256("aic-cookie-v1:" + pass);
      return new Response(null, { status: 303, headers: { location: next, "cache-control": "no-store",
        "set-cookie": `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax` } });
    }
    return loginPage("That passcode isn't right. Please try again (it's case-sensitive).", next, 401);
  }
  const token = readCookie(request, COOKIE);
  if (token && same(await sha256(token), SESSION_CHECK)) return; // signed in: serve the site as normal
  if (/\.json$/i.test(url.pathname)) {
    return new Response("Passcode required", { status: 401, headers: { "cache-control": "no-store" } });
  }
  return loginPage("", safeNext(url.pathname + url.search), 200);
};

export const config = { path: "/*" };
