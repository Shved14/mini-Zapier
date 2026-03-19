import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  private resendApiKey: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY || 're_demo_key';
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      // Для демонстрации - просто логируем код
      console.log(`📧 Verification code for ${email}: ${code}`);
      
      // В реальном приложении здесь будет вызов Resend API
      // const response = await fetch('https://api.resend.com/emails', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.resendApiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     from: 'onboarding@resend.dev',
      //     to: [email],
      //     subject: 'Mini Zapier - Verification Code',
      //     html: `
      //       <h1>Your verification code is: <strong>${code}</strong></h1>
      //       <p>This code will expire in 10 minutes.</p>
      //       <p>If you didn't request this code, please ignore this email.</p>
      //     `,
      //   }),
      // });
      
      // return response.ok;
      
      return true; // Для демонстрации всегда возвращаем true
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
