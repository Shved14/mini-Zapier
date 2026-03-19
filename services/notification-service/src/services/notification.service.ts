import { prisma } from "../utils/prisma";
import { sendEmail } from "../channels/email.channel";
import { sendTelegram } from "../channels/telegram.channel";

export class AppError extends Error {
  public statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

const VALID_TYPES = ["workflow_invite", "trial_expiration", "workflow_error"] as const;
const VALID_CHANNELS = ["telegram", "email"] as const;

export type NotificationType = (typeof VALID_TYPES)[number];
export type NotificationChannel = (typeof VALID_CHANNELS)[number];

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  recipient: string; // email address or telegram chatId
}

export async function createAndSend(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      channel: input.channel,
      title: input.title,
      message: input.message,
      status: "pending",
    },
  });

  try {
    if (input.channel === "email") {
      await sendEmail(input.recipient, input.title, input.message);
    } else if (input.channel === "telegram") {
      await sendTelegram(input.recipient, input.title, input.message);
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "sent", sentAt: new Date() },
    });

    return updated;
  } catch (err: any) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "failed", error: err.message },
    });

    throw new AppError(502, `Failed to send via ${input.channel}: ${err.message}`);
  }
}

export async function getByUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
