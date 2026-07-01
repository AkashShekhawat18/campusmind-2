const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding student user...');
  
  const email = 'student@campusmind.ai';
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log('Student user already exists:', existingUser.email);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('student123', salt);

  const studentUser = await prisma.user.create({
    data: {
      name: 'Demo Student',
      email: email,
      password: hashedPassword,
      role: 'STUDENT',
      studentProfile: {
        create: {
          department: 'Computer Science',
          semester: 6,
          course: 'B.E. (Hons.)'
        }
      },
      studentSettings: {
        create: {
          theme: 'dark'
        }
      }
    }
  });

  console.log('Created student user:', studentUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
