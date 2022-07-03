import { PrismaClient } from "@prisma/client";
import env from "../modules/env";

declare const global: NodeJS.Global & { prisma?: PrismaClient };

const prisma: PrismaClient = global.prisma || new PrismaClient();

if (env.isDevelopment) global.prisma = prisma;

export default prisma;
