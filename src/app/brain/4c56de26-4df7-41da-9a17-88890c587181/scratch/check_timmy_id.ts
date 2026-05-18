import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      username: 'timmy_turner'
    },
    include: {
      child: true
    }
  });

  console.log("timmy_turner User:", user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
