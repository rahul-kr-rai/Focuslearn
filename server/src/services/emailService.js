import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

/**
 * Initialize nodemailer transporter if credentials are configured.
 */
function getTransporter() {
  if (transporter) return transporter;

  // Check if SMTP or Gmail is configured
  if (env.SMTP_HOST || (env.SMTP_USER && env.SMTP_PASS)) {
    const config = env.SMTP_HOST
      ? {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          auth:
            env.SMTP_USER && env.SMTP_PASS
              ? {
                  user: env.SMTP_USER,
                  pass: env.SMTP_PASS,
                }
              : undefined,
        }
      : {
          service: 'gmail',
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        };

    transporter = nodemailer.createTransport(config);
    return transporter;
  }

  return null;
}

/**
 * Verify email configuration on server startup and output status.
 */
export async function verifyEmailConfig() {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.warn(`
  ⚠️  EMAIL SERVICE: No SMTP / Gmail credentials configured.
     Set GMAIL_USER and GMAIL_PASS (16-char App Password) in server/.env
     Currently running in local console simulation mode.
    `);
    return { ready: false, reason: 'Credentials not configured' };
  }

  try {
    await mailTransporter.verify();
    console.log(`  ✉️  Email Service: Authenticated & Ready (${env.SMTP_USER})`);
    return { ready: true };
  } catch (err) {
    let diag = err.message;
    if (err.code === 'EAUTH') {
      diag = 'Gmail authentication rejected. Verify your GMAIL_USER and 16-character GMAIL_PASS App Password.';
    }
    console.error(`
  ❌ EMAIL SERVICE ERROR: Failed to connect to mail server:
     Reason: ${diag}
     Code:   ${err.code || 'UNKNOWN'}
    `);
    return { ready: false, reason: diag, code: err.code };
  }
}

/**
 * Generate responsive HTML email for password reset.
 */
function getPasswordResetTemplate({ name, resetUrl, clientUrl }) {
  const safeName = name ? name.split(' ')[0] : 'there';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - FocusLearn</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b1120;
      color: #f8fafc;
      margin: 0;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 580px;
      margin: 0 auto;
      background-color: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #334155;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
      padding: 32px 28px;
      text-align: center;
      border-bottom: 1px solid #334155;
    }
    .brand {
      display: inline-block;
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #38bdf8;
    }
    .content {
      padding: 36px 32px;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 16px;
    }
    p {
      margin: 0 0 16px;
      font-size: 15px;
      color: #94a3b8;
    }
    .btn-container {
      margin: 32px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
    }
    .warning-box {
      background-color: rgba(245, 158, 11, 0.1);
      border-left: 4px solid #f59e0b;
      padding: 14px 16px;
      border-radius: 6px;
      margin: 24px 0;
      font-size: 13.5px;
      color: #cbd5e1;
    }
    .link-fallback {
      font-size: 12px;
      color: #64748b;
      word-break: break-all;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #334155;
    }
    .link-fallback a {
      color: #38bdf8;
    }
    .footer {
      background-color: #0f172a;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <a href="${clientUrl}" class="brand">Focus<span>Learn</span></a>
    </div>
    <div class="content">
      <h1 class="title">Reset Your Password</h1>
      <p>Hello ${safeName},</p>
      <p>We received a request to reset the password associated with your FocusLearn account. Click the button below to choose a new password:</p>
      
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
      </div>

      <div class="warning-box">
        ⏳ <strong>Security Notice:</strong> This link is single-use and will expire in <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this email; your account remains secure.
      </div>

      <div class="link-fallback">
        <p>If the button above does not work, copy and paste this link into your browser:</p>
        <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">${resetUrl}</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} FocusLearn LMS. Distraction-Free Learning Platform.</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Send Password Reset Email.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - Recipient user name
 * @param {string} options.token - Raw reset token
 * @returns {Promise<{ sent: boolean, simulated: boolean, resetUrl: string, error?: string }>}
 */
export async function sendPasswordResetEmail({ to, name, token }) {
  const resetUrl = `${env.CLIENT_URL.replace(/\/$/, '')}/reset-password/${token}`;
  const mailTransporter = getTransporter();

  if (mailTransporter) {
    try {
      console.log(`✉️  [EmailService] Sending password reset email to ${to}...`);
      const info = await mailTransporter.sendMail({
        from: `"${env.FROM_NAME}" <${env.FROM_EMAIL}>`,
        to,
        subject: 'FocusLearn: Reset Your Password',
        text: `Hello ${name},\n\nYou requested a password reset for your FocusLearn account.\n\nPlease reset your password using the following link (valid for 15 minutes):\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\n— The FocusLearn Team`,
        html: getPasswordResetTemplate({ name, resetUrl, clientUrl: env.CLIENT_URL }),
      });

      console.log(`✅ [EmailService] Password reset email successfully delivered to ${to} (MessageId: ${info.messageId})`);
      return { sent: true, simulated: false, resetUrl, messageId: info.messageId };
    } catch (err) {
      let diag = err.message;
      if (err.code === 'EAUTH') {
        diag = 'Authentication failed. Check your GMAIL_USER and 16-character GMAIL_PASS App Password.';
      } else if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT') {
        diag = 'Connection to mail server timed out.';
      }

      console.error(`❌ [EmailService] Failed to send email to ${to}:`, diag);
      console.error(`   Error details:`, err);
      return { sent: false, simulated: false, resetUrl, error: diag, code: err.code };
    }
  }

  // Fallback / Development Simulation
  console.log(`
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║ ✉️  FOCUSLEARN PASSWORD RESET (DEV SIMULATION)                         ║
  ╠═══════════════════════════════════════════════════════════════════════╣
  ║ To:       ${to.padEnd(59)} ║
  ║ User:     ${(name || 'User').padEnd(59)} ║
  ║ Expiry:   15 minutes                                                  ║
  ║ Reset URL:                                                            ║
  ║ ${resetUrl.padEnd(69)} ║
  ╚═══════════════════════════════════════════════════════════════════════╝
  `);

  return { sent: true, simulated: true, resetUrl };
}
