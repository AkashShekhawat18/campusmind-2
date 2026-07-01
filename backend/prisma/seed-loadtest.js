const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting load test seed...');

  // Ensure basic academic hierarchy exists
  const college = await prisma.college.upsert({
    where: { name: 'Load Test College' },
    update: {},
    create: { name: 'Load Test College', location: 'Test City' }
  });

  const department = await prisma.department.upsert({
    where: { name: 'Load Test Dept' },
    update: {},
    create: { name: 'Load Test Dept', collegeId: college.id }
  });

  const program = await prisma.program.create({
    data: { name: `B.Tech Load Test ${Date.now()}`, departmentId: department.id }
  });

  const academicYear = await prisma.academicYear.upsert({
    where: { year: '2026-2027' },
    update: {},
    create: { year: '2026-2027', isCurrent: true }
  });

  const semester = await prisma.semester.create({
    data: { number: 1, programId: program.id, academicYearId: academicYear.id }
  });

  const branch = await prisma.branch.create({
    data: { name: `CS Load Test ${Date.now()}`, departmentId: department.id }
  });

  const section = await prisma.section.create({
    data: { name: `Section A ${Date.now()}`, semesterId: semester.id }
  });

  const subject = await prisma.subject.create({
    data: { name: `Load Test Subject ${Date.now()}`, code: `LTS-${Date.now()}`, credits: 4, branchId: branch.id, semesterId: semester.id }
  });

  console.log('Hierarchy created. Seeding 2000 Teachers...');
  // Seed 2000 Teachers in chunks
  for (let i = 0; i < 20; i++) {
    const chunk = [];
    for (let j = 0; j < 100; j++) {
      const idx = i * 100 + j;
      chunk.push({
        id: `teacher-user-${Date.now()}-${idx}`,
        name: `Load Test Teacher ${idx}`,
        email: `teacher${idx}_${Date.now()}@test.com`,
        password: 'password123',
        role: 'TEACHER',
        status: 'ACTIVE',
        officialId: `T-TEST-${Date.now()}-${idx}`,
        firstLogin: false
      });
    }
    await prisma.user.createMany({ data: chunk });
    
    const teacherProfilesChunk = chunk.map(u => ({
      userId: u.id,
      departmentId: department.id,
      status: 'ACTIVE'
    }));
    await prisma.teacherProfile.createMany({ data: teacherProfilesChunk });
  }

  console.log('Seeding 2000 Students...');
  // Seed 2000 Students in chunks
  for (let i = 0; i < 20; i++) {
    const chunk = [];
    for (let j = 0; j < 100; j++) {
      const idx = i * 100 + j;
      chunk.push({
        id: `student-user-${Date.now()}-${idx}`,
        name: `Load Test Student ${idx}`,
        email: `student${idx}_${Date.now()}@test.com`,
        password: 'password123',
        role: 'STUDENT',
        status: 'ACTIVE',
        officialId: `S-TEST-${Date.now()}-${idx}`,
        firstLogin: false
      });
    }
    await prisma.user.createMany({ data: chunk });

    const studentProfilesChunk = chunk.map(u => ({
      userId: u.id,
      branchId: branch.id,
      currentSemesterId: semester.id,
      currentSectionId: section.id,
      status: 'ACTIVE'
    }));
    await prisma.studentProfile.createMany({ data: studentProfilesChunk });
  }

  console.log('Seed completed successfully. Loaded 4000 users.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
