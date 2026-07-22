import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log("Success! Found user via lib/prisma:", user);
  } catch (error) {
    console.error("Prisma error via lib/prisma:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
