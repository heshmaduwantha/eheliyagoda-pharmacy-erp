import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient({
  datasourceUrl: "postgresql://pavithrameddaduwage@127.0.0.1:5432/medisquare",
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log("Success! Found user:", user);
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
