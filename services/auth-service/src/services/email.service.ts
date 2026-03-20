import axios from 'axios';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'onboarding@resend.dev';

  if (!apiKey) {
    console.warn('⚠️ No RESEND_API_KEY or SMTP_PASS configured, skipping email');
    return;
  }

  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from,
        to: [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log(`✅ Email sent to ${options.to}: ${options.subject} (id: ${response.data?.id})`);
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    console.error(`❌ Failed to send email to ${options.to}:`, msg);
    throw new Error(`Failed to send email: ${msg}`);
  }
}

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Mini Zapier - Verification Code',
    text: `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Mini Zapier</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333;">Email Verification</h3>
          <p style="color: #666;">Your verification code is:</p>
          <div style="background: #6366f1; color: white; font-size: 24px; font-weight: bold; padding: 15px; text-align: center; border-radius: 4px; letter-spacing: 2px;">
            ${code}
          </div>
          <p style="color: #666; margin-top: 20px;">This code will expire in 10 minutes.</p>
        </div>
        <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  });
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
