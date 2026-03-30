import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function clean() {
  await prisma.portfolioHolding.deleteMany({});
  await prisma.investment.deleteMany({});
  await prisma.transaction.deleteMany({});
  console.log('✅ Deleted all mock holdings, investments, and transactions.');
}
clean().catch(console.error).finally(()=>prisma.$disconnect());
