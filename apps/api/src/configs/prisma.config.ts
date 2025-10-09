import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let withAccelerate: any = undefined;
try {
  // dynamic require to avoid hard failure if package isn't installed yet
  // (during local dev or CI). TypeScript will strip require at runtime.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  withAccelerate = require("@prisma/extension-accelerate").withAccelerate;
} catch (e) {
  // ignore — we'll run without accelerate
}

// Prefer DATABASE_URL by default. DIRECT_URL is a fallback.
const dbUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
const clientOptions = dbUrl ? { datasources: { db: { url: dbUrl } } } : {};

let prismaClient: PrismaClient;
if (globalForPrisma.prisma) {
  prismaClient = globalForPrisma.prisma;
} else {
  const base = new PrismaClient(clientOptions as any);
  if (
    process.env.DATABASE_URL?.startsWith("prisma+") &&
    typeof withAccelerate === "function"
  ) {
    try {
      // $extends returns a dynamic extended client type; cast to any/PrismaClient
      // so our exports keep the expected runtime shape.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaClient = base.$extends(withAccelerate()) as any as PrismaClient;
    } catch (e) {
      // fallback to base client if extension fails
      // eslint-disable-next-line no-console
      console.warn(
        "[prisma] failed to enable accelerate extension, falling back to plain client",
        e
      );
      prismaClient = base;
    }
  } else {
    prismaClient = base;
  }

  // Cache the Prisma client on globalThis to avoid creating new instances
  // on every module import. In serverless platforms (Vercel) this helps
  // reuse the client across warm invocations and avoids using a client
  // that was previously disconnected. Storing on globalThis is safe as
  // PrismaClient is a single long-lived instance.
  globalForPrisma.prisma = prismaClient;
}

export const prisma = prismaClient;
