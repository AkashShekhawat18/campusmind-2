const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create some default subjects
  const subjects = [
    { name: 'Data Structures & Algorithms', department: 'Computer Science', semester: 3 },
    { name: 'Database Management Systems', department: 'Computer Science', semester: 4 },
    { name: 'Operating Systems', department: 'Computer Science', semester: 5 },
    { name: 'Computer Networks', department: 'Computer Science', semester: 5 },
    { name: 'Software Engineering', department: 'Computer Science', semester: 6 },
    { name: 'Machine Learning', department: 'Computer Science', semester: 7 },
    { name: 'Digital Electronics', department: 'Electronics', semester: 3 },
    { name: 'Signals & Systems', department: 'Electronics', semester: 4 },
  ];

  for (const subj of subjects) {
    await prisma.subject.upsert({
      where: {
        name_department_semester: {
          name: subj.name,
          department: subj.department,
          semester: subj.semester
        }
      },
      update: {},
      create: subj
    });
  }

  console.log(`✅ ${subjects.length} subjects seeded.`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
