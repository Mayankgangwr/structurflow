export interface BaseEmailOptions {
    title: string;
    subtitle: string;
    badgeText?: string;
    contentHtml: string;
    securityNotice?: string;
    footerText?: string;
}

export function renderBaseEmailLayout({
    title,
    subtitle,
    badgeText = "Security Verification",
    contentHtml,
    securityNotice = "Structurflow security team will never ask for your verification code or password.",
    footerText = "Enterprise Workflow & Document Structuring Platform",
}: BaseEmailOptions): string {
    const currentYear = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 48px 16px;
    }
    .email-container {
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      border: 1px solid #e2e8f0;
    }
    .email-header {
      background: linear-gradient(135deg, #090d16 0%, #172033 100%);
      padding: 36px 32px 30px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 25px;
      font-weight: 700;
      letter-spacing: -0.6px;
      margin: 0;
      display: inline-block;
    }
    .logo-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background-color: #2563eb;
      border-radius: 50%;
      margin-left: 2px;
    }
    .badge {
      display: inline-block;
      margin-top: 10px;
      padding: 5px 14px;
      background-color: rgba(37, 99, 235, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 9999px;
      color: #60a5fa;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .email-body {
      padding: 36px 32px 32px;
      text-align: center;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    p.subtitle {
      margin: 0 0 24px;
      font-size: 14.5px;
      line-height: 1.6;
      color: #64748b;
    }
    .info-box {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 24px;
      text-align: left;
    }
    .info-box p {
      margin: 0;
      font-size: 12.5px;
      color: #1e40af;
      line-height: 1.5;
    }
    .email-footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      border-top: 1px solid #f1f5f9;
      text-align: center;
    }
    .email-footer p {
      margin: 0 0 6px;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="logo">Structurflow<span class="logo-dot"></span></div>
        ${badgeText ? `<br><div class="badge">${badgeText}</div>` : ""}
      </div>
      <div class="email-body">
        <h1>${title}</h1>
        <p class="subtitle">${subtitle}</p>

        ${contentHtml}

        ${
          securityNotice
            ? `<div class="info-box">
                 <p>🔒 <strong>Security Tip:</strong> ${securityNotice}</p>
               </div>`
            : ""
        }

        <p style="font-size: 12.5px; color: #94a3b8; margin: 0; line-height: 1.5;">
          If you didn't request this action, you can safely disregard this email. Your account remains secure.
        </p>
      </div>
      <div class="email-footer">
        <p>© ${currentYear} Structurflow Inc. All rights reserved.</p>
        <p>${footerText}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
