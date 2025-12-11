// Welcome Email Template for Newsletter Subscribers

export function getWelcomeEmailHTML(name: string = 'suscriptor'): { html: string; text: string } {
    const greeting = name ? `Hola ${name},` : '¡Hola!';
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido a BIDXAAGUI!</title>
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a BIDXAAGUI!</h1>
    </div>
    <div class="content">
      <h2>${greeting}</h2>
      <p>¡Gracias por suscribirte a nuestro boletín informativo! Estamos emocionados de tenerte con nosotros.</p>
      
      <p>Con tu suscripción, recibirás actualizaciones sobre nuestros proyectos, eventos y noticias relevantes en el mundo de la arquitectura y el diseño.</p>
      
      <p>Si en algún momento deseas darte de baja, puedes hacerlo haciendo clic en el enlace de cancelar suscripción que aparece al final de cada correo.</p>
      
      <p>¡Esperamos que disfrutes de nuestro contenido!</p>
      
      <p>Saludos,<br>El equipo de BIDXAAGUI</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} BIDXAAGUI. Todos los derechos reservados.</p>
      <p>
        <a href="https://bidxaagui.com" style="color: #b85c3c; text-decoration: none;">Visita nuestro sitio web</a> | 
        <a href="{{unsubscribe_url}}" style="color: #b85c3c; text-decoration: none;">Cancelar suscripción</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `${greeting}

¡Gracias por suscribirte a nuestro boletín informativo! Estamos emocionados de tenerte con nosotros.

Con tu suscripción, recibirás actualizaciones sobre nuestros proyectos, eventos y noticias relevantes en el mundo de la arquitectura y el diseño.

Si en algún momento deseas darte de baja, puedes hacerlo respondiendo a este correo o siguiendo el enlace de cancelación en el pie de este mensaje.

¡Esperamos que disfrutes de nuestro contenido!

Saludos,
El equipo de BIDXAAGUI

---
© ${new Date().getFullYear()} BIDXAAGUI. Todos los derechos reservados.
Visita nuestro sitio web: https://bidxaagui.com
Cancelar suscripción: {{unsubscribe_url}}`;

    return { html, text };
}

export default getWelcomeEmailHTML;
