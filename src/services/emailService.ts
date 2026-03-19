import { env } from "../config/env";
import { logger } from "../utils/logger";

export const emailService = {
  async sendVerificationCode(email: string, code: string) {
    if (!env.RESEND_API_KEY) {
      logger.warn("RESEND_API_KEY not set — logging verification code instead", { email, code });
      logger.info(`Verification code for ${email}: ${code}`);
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: [email],
        subject: "Your verification code",
        html: `<p>Your verification code: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("Resend API error", { status: res.status, body });
      throw new Error("Failed to send verification email");
    }
  },

  async sendInviteEmail(email: string, workflowName: string, inviteLink: string) {
    if (!env.RESEND_API_KEY) {
      logger.warn("RESEND_API_KEY not set — logging invite link instead", { email, inviteLink });
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: [email],
        subject: `You're invited to workflow: ${workflowName}`,
        html: `<p>You've been invited to collaborate on the workflow <strong>${workflowName}</strong>.</p><p><a href="${inviteLink}">Click here to accept the invitation</a></p>`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("Resend invite email error", { status: res.status, body });
    }
  },
};
