import { prisma } from '../utils/prisma';

interface VerificationCode {
  email: string;
  code: string;
  expiresAt: Date;
}

export async function storeVerificationCode(email: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

  // Удаляем старые коды для этого email
  await prisma.verificationCodes.deleteMany({
    where: { email }
  });

  // Сохраняем новый код
  await prisma.verificationCodes.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const verification = await prisma.verificationCodes.findFirst({
    where: {
      email,
      code,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!verification) {
    return false;
  }

  // Удаляем использованный код
  await prisma.verificationCodes.delete({
    where: { id: verification.id }
  });

  return true;
}

export async function cleanupExpiredCodes(): Promise<void> {
  await prisma.verificationCodes.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}
