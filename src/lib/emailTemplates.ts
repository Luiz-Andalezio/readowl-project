// Change: increase button padding to make it larger
export function passwordResetTemplate(params: { userName?: string | null; actionUrl: string; expiresMinutes: number }) {
  const { userName, actionUrl, expiresMinutes } = params;
  return `
  <!doctype html>
  <html lang="pt-br">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Redefinição de senha – Readowl</title>
      <style>
        body { background:#836DBE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif; }
        .card { max-width:520px; margin:0 auto; background:#836DBE; box-shadow:0 2px 12px rgba(40,20,60,0.12);}
        .content { padding:32px 28px }
        .brand { display:flex; gap:12px; align-items:center; }
        .title { color:#fff; margin:0 }
        .btn { 
          display:inline-block; 
          padding:16px 40px; /* Aumentado o padding para deixar o botão maior */
          font-size:18px;    /* Aumentado o tamanho da fonte */
          background:#9E85E0; 
          color:#fff !important; 
          text-decoration:none; 
          border:2px solid #6750A4; 
          font-weight:600; 
          transition:background 0.2s 
        }
        .btn:hover { background:#A78CF0; }
        .muted { color:#F0EAFF }
        .footer { font-size:12px; color:#fff; text-align:center; margin-top:18px }
        a { color:#fff }
        .token-link-box { background:#F0EAFF; color:#fff; padding:12px; font-size:13px; word-break:break-all; margin-top:8px; border:1px solid #6750A4 }
        hr { border:0; border-top:1px solid #fff; margin:24px 0 }
      </style>
    </head>
    <body>
      <div style="padding:32px">
        <div class="card" role="group" aria-label="Email de redefinição de senha Readowl">
          <div class="content">
            <div class="brand" style="margin-bottom:16px">
              <img src="cid:readowl-logo" alt="Readowl" width="36" height="36"/>
              <h1 class="title">Readowl</h1>
            </div>
            <h2 style="color:#fff;margin:12px 0 8px">Redefinição de senha</h2>
            <p class="muted" style="line-height:1.6">Olá${userName ? `, <b style='color:#fff'>${userName}</b>` : ""}! Recebemos uma solicitação para redefinir sua senha no Readowl.</p>
            <p class="muted" style="line-height:1.6">Use o botão abaixo para criar uma nova senha. Este link expira em <b>${expiresMinutes} minutos</b>.</p>
            <p style="margin:20px 0;text-align:center">
              <a class="btn" href="${actionUrl}">Redefinir senha</a>
            </p>
            <p class="muted" style="font-size:13px;margin-bottom:4px">Se o botão não funcionar, copie e cole esta URL no navegador:</p>
            <div class="token-link-box">${actionUrl}</div>
            <hr/>
            <p class="muted" style="font-size:12px">Se você não fez esta solicitação, pode ignorar este email com segurança.</p>
            <div class="footer">© ${new Date().getFullYear()} Readowl</div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}
