import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@cloudvault.dev' },
    update: {},
    create: {
      fullName: 'Alice Johnson',
      email: 'alice@cloudvault.dev',
      passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@cloudvault.dev' },
    update: {},
    create: {
      fullName: 'Bob Smith',
      email: 'bob@cloudvault.dev',
      passwordHash,
    },
  });

  const universityFolder = await prisma.folder.create({
    data: { name: 'University', ownerId: alice.id },
  });

  await prisma.folder.create({
    data: { name: 'Projects', ownerId: alice.id, parentFolderId: universityFolder.id },
  });

  console.log('Seed complete:');
  console.log(`  ${alice.email} / Password123!`);
  console.log(`  ${bob.email} / Password123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
