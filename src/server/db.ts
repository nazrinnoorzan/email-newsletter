import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

import { env } from "~/env";

const customUUID = () => {
  const uuid = randomUUID();
  const first25UUID = uuid.substring(0, 25);

  return `subiber${first25UUID}`;
};

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends({
    name: "custom-subscriber-id",
    query: {
      subscriber: {
        async create({ args, query }) {
          args.data = {
            ...args.data,
            id: customUUID(),
          };

          return query(args);
        },
      },
    },
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
