import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    this.transporter = nodemailer.createTransport(config);

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email service connection failed:', error);
      } else {
        this.logger.log('Email service connected successfully');
      }
    });
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || `"mini-Zapier" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify your email address',
        html: this.getVerificationEmailTemplate(code),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || `"mini-Zapier" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset your password',
        html: this.getPasswordResetEmailTemplate(token),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  private getVerificationEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .code {
            background: #fff;
            border: 2px dashed #667eea;
            padding: 20px;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #667eea;
            margin: 20px 0;
            border-radius: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 mini-Zapier</h1>
          <p>Verify Your Email Address</p>
        </div>
        
        <div class="content">
          <h2>Welcome to mini-Zapier!</h2>
          <p>Thank you for signing up. To complete your registration, please use the verification code below:</p>
          
          <div class="code">${code}</div>
          
          <p><strong>This code will expire in 15 minutes.</strong></p>
          <p>If you didn't request this verification, please ignore this email.</p>
          
          <div class="footer">
            <p>Best regards,<br>The mini-Zapier Team</p>
            <p>© 2024 mini-Zapier. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(token: string): string {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 mini-Zapier</h1>
          <p>Reset Your Password</p>
        </div>
        
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
          
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          
          <div class="footer">
            <p>Best regards,<br>The mini-Zapier Team</p>
            <p>© 2024 mini-Zapier. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
