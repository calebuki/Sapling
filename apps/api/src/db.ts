import prismaClientPkg from '@prisma/client';

const { PrismaClient } = prismaClientPkg;

export const prisma = new PrismaClient();
