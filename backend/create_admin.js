const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating admin user...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@campusmind.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      name: 'Super Admin',
      email: 'admin@campusmind.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log(`✅ Admin created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
