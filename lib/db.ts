import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    transactionOptions: {
      // Remote pooled databases can take longer than Prisma's default maxWait (2s)
      // when multiple reconcile jobs contend for transactions during local development.
      maxWait: parseInt(process.env.PRISMA_TRANSACTION_MAX_WAIT_MS || '15000', 10),
      timeout: parseInt(process.env.PRISMA_TRANSACTION_TIMEOUT_MS || '60000', 10),
    },
  });
};

export const prisma = global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
