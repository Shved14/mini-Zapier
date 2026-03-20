import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create a simple email transporter
// In production, you'd use real SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "your-email@gmail.com",
    pass: process.env.SMTP_PASS || "your-app-password",
  },
});

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Mini-Zapier" <${process.env.SMTP_USER || "noreply@minizapier.com"}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

// For development/testing, log the email instead of sending it
export async function logEmail(options: EmailOptions): Promise<void> {
  console.log("=== EMAIL SENT ===");
  console.log("To:", options.to);
  console.log("Subject:", options.subject);
  console.log("HTML:", options.html.substring(0, 200) + "...");
  console.log("================");
}

// Use logEmail in development if SMTP is not configured
export const emailService = process.env.NODE_ENV === "production" ? sendEmail : logEmail;
