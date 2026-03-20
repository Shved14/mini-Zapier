import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`✅ Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error);
    throw new Error('Failed to send email');
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
