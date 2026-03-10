import { PrismaClient } from "@prisma/client";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = () =>
  new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

export const prisma: PrismaClient =
  global.prisma ??
  createPrismaClient();

if (env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

