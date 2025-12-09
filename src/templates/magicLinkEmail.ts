// Magic Link Email Template with BIDXAAGUI branding

export function getMagicLinkEmailHTML(magicLink: string, expirationMinutes: number): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enlace de Acceso - BIDXAAGUI</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #faf7f0;
      color: #4a5239;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(74, 82, 57, 0.12);
      overflow: hidden;
    }
    .header {
      background-color: #4a5239;
      color: #faf7f0;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      letter-spacing: 1px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #4a5239;
      font-size: 24px;
      margin: 0 0 20px;
    }
    .content p {
      color: #4a5239;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 20px;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background-color: #b85c3c;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 999px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(184, 92, 60, 0.3);
      transition: all 0.2s ease;
    }
    .button:hover {
      background-color: #a04d2f;
      box-shadow: 0 6px 16px rgba(184, 92, 60, 0.4);
    }
    .info-box {
      background-color: rgba(184, 92, 60, 0.08);
      border-left: 4px solid #b85c3c;
      padding: 16px 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .info-box p {
      margin: 0;
      font-size: 14px;
      color: #4a5239;
    }
    .footer {
      background-color: #faf7f0;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #d4b5a8;
    }
    .footer p {
      margin: 0 0 10px;
      font-size: 13px;
      color: #7a8264;
    }
    .footer a {
      color: #b85c3c;
      text-decoration: none;
    }
    .link-text {
      word-break: break-all;
      font-size: 12px;
      color: #7a8264;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>BIDXAAGUI</h1>
      <p>Panel de Administración</p>
    </div>

    <!-- Content -->
    <div class="content">
      <h2>¡Tu enlace de acceso está listo!</h2>
      
      <p>
        Has solicitado acceso al panel de administración de BIDXAAGUI.
        Haz clic en el botón de abajo para iniciar sesión de forma segura.
      </p>

      <!-- CTA Button -->
      <div class="button-container">
        <a href="${magicLink}" class="button">
          Acceder al Panel
        </a>
      </div>

      <!-- Security Info -->
      <div class="info-box">
        <p>
          <strong>⏱️ Importante:</strong> Este enlace expirará en ${expirationMinutes} minutos
          por razones de seguridad y solo puede usarse una vez.
        </p>
      </div>

      <p style="font-size: 14px; color: #7a8264;">
        Si no solicitaste este acceso, puedes ignorar este correo de forma segura.
        Nadie podrá acceder a tu cuenta sin este enlace.
      </p>

      <!-- Alternative link -->
      <p class="link-text">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <a href="${magicLink}" style="color: #b85c3c;">${magicLink}</a>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>BIDXAAGUI</strong> © ${new Date().getFullYear()}</p>
      <p>
        Medicina Naturista · Antropología Biológica<br>
        <a href="https://bidxaagui.com">bidxaagui.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Plain text version (fallback)
export function getMagicLinkEmailText(magicLink: string, expirationMinutes: number): string {
    return `
BIDXAAGUI - Panel de Administración

¡Tu enlace de acceso está listo!

Has solicitado acceso al panel de administración de BIDXAAGUI.

Para iniciar sesión, accede al siguiente enlace:
${magicLink}

IMPORTANTE:
- Este enlace expirará en ${expirationMinutes} minutos por seguridad
- Solo puede usarse una vez
- Si no solicitaste este acceso, ignora este correo

---
BIDXAAGUI © ${new Date().getFullYear()}
Medicina Naturista · Antropología Biológica
https://bidxaagui.com
  `.trim();
}
