import { PrismaClient } from "@prisma/client";

declare const global: NodeJS.Global & { prisma?: PrismaClient };

const prisma: PrismaClient = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export default prisma;
