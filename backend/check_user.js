const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'dhruvj9928@gmail.com';
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Dhruv@123', salt);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    },
    create: {
      email,
      name: 'Admin Dhruv',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  
  console.log('User created/updated successfully:', {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
