import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureFolder(name: string, ownerId: string, parentFolderId: string | null = null) {
  const existing = await prisma.folder.findFirst({ where: { name, ownerId, parentFolderId } });
  if (existing) return existing;
  return prisma.folder.create({ data: { name, ownerId, parentFolderId } });
}

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const alice = await prisma.user.upsert({
    where: { email: 'alice@cloudvault.dev' },
    update: {},
    create: { fullName: 'Alice Johnson', email: 'alice@cloudvault.dev', passwordHash },
  });
  const bob = await prisma.user.upsert({
    where: { email: 'bob@cloudvault.dev' },
    update: {},
    create: { fullName: 'Bob Smith', email: 'bob@cloudvault.dev', passwordHash },
  });
  const university = await ensureFolder('University', alice.id);
  await ensureFolder('Projects', alice.id, university.id);

  console.log('Seed complete:');
  console.log(`  ${alice.email} / Password123!`);
  console.log(`  ${bob.email} / Password123!`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
