'use strict';

/**
 * Shared layout wrapper for all emails.
 * Inlines a minimal but polished design that renders well in Gmail,
 * Outlook, Apple Mail, and mobile clients.
 */
function layout({ title, preheader, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Preheader (hidden preview text in inbox) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
         style="background-color:#f4f6f9;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
               style="max-width:600px;background:#ffffff;border-radius:12px;
                      overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);
                        padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;
                         color:#a0c4ff;font-weight:600;">Yassine Chadani</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;
                          letter-spacing:-0.3px;">${title}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;
                        padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                This email was sent automatically from your portfolio contact form.<br/>
                If you didn't expect this, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// 1. NOTIFICATION EMAIL  →  sent to YOU (the site owner)
// ---------------------------------------------------------------------------
function notificationTemplate({ name, email, subject, message }) {
  const timestamp = new Date().toLocaleString('en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Africa/Casablanca',
  });

  const body = `
    <!-- Greeting -->
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
      Hey Yassine 👋 — you have a new message from your portfolio.
    </p>

    <!-- Sender card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:#f0f4ff;border-radius:8px;padding:0;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;
                     letter-spacing:2px;color:#6b7280;font-weight:600;">From</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#1a1a2e;">${name}</p>
          <a href="mailto:${email}"
             style="font-size:14px;color:#3b82f6;text-decoration:none;">${email}</a>
        </td>
      </tr>
    </table>

    <!-- Subject -->
    <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:2px;
               color:#6b7280;font-weight:600;">Subject</p>
    <p style="margin:0 0 24px;font-size:16px;font-weight:600;color:#1f2937;">${subject}</p>

    <!-- Message -->
    <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:2px;
               color:#6b7280;font-weight:600;">Message</p>
    <div style="background:#f9fafb;border-left:3px solid #3b82f6;border-radius:0 8px 8px 0;
                 padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0;font-size:15px;color:#374151;line-height:1.8;
                 white-space:pre-wrap;">${message}</p>
    </div>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom:8px;">
          <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}"
             style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);
                     color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;
                     font-size:15px;font-weight:600;letter-spacing:0.2px;">
            Reply to ${name}
          </a>
        </td>
      </tr>
    </table>

    <!-- Meta -->
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
      Received · ${timestamp}
    </p>
  `;

  return layout({
    title: 'New Contact Message',
    preheader: `${name} sent you a message: "${subject}"`,
    body,
  });
}

// ---------------------------------------------------------------------------
// 2. AUTO-REPLY EMAIL  →  sent to the person who contacted you
// ---------------------------------------------------------------------------
function autoReplyTemplate({ name, subject }) {
  const body = `
    <!-- Greeting -->
    <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.7;">
      Hi <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.8;">
      Thank you for reaching out! I've received your message about
      <strong>"${subject}"</strong> and I'll get back to you as soon as possible —
      usually within <strong>24–48 hours</strong>.
    </p>

    <!-- What to expect box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:#f0fdf4;border-radius:8px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#166534;
                     text-transform:uppercase;letter-spacing:1px;">What happens next</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;">
                <p style="margin:0;font-size:14px;color:#374151;">
                  ✦&nbsp; I'll review your message personally
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;">
                <p style="margin:0;font-size:14px;color:#374151;">
                  ✦&nbsp; You'll receive a reply at this email address
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;">
                <p style="margin:0;font-size:14px;color:#374151;">
                  ✦&nbsp; Response time: 24–48 hours on business days
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.8;">
      In the meantime, feel free to explore my work or connect with me on LinkedIn.
    </p>

    <!-- Links -->
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:12px;">
          <a href="https://portfolio-tawny-seven-72.vercel.app/"
             style="display:inline-block;background:#1a1a2e;color:#ffffff;
                     text-decoration:none;padding:12px 24px;border-radius:8px;
                     font-size:14px;font-weight:600;">
            View Portfolio
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:32px 0 0;font-size:15px;color:#374151;line-height:1.7;">
      Talk soon,<br/>
      <strong style="color:#1a1a2e;">Yassine Chadani</strong><br/>
      <span style="font-size:13px;color:#6b7280;">Full-Stack Developer</span>
    </p>
  `;

  return layout({
    title: 'Message Received ✓',
    preheader: `Thanks ${name}! I got your message and will reply shortly.`,
    body,
  });
}

module.exports = { notificationTemplate, autoReplyTemplate };