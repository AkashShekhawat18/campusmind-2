const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBenchmarks() {
  console.log("=== CampusMind Comprehensive DB Benchmark & Stress Test ===");
  
  // Determine current size
  let userCount = await prisma.user.count();
  console.log(`Starting User Count: ${userCount}`);
  
  const targetTiers = [50, 500, 5000, 10000];
  
  // Data for relationships
  let college = await prisma.college.findFirst() || await prisma.college.create({ data: { name: 'Bench College', location: 'Bench City' } });
  let dept = await prisma.department.findFirst() || await prisma.department.create({ data: { name: 'Bench Dept', collegeId: college.id } });
  let branch = await prisma.branch.findFirst() || await prisma.branch.create({ data: { name: 'Bench Branch', departmentId: dept.id } });
  let prog = await prisma.program.findFirst() || await prisma.program.create({ data: { name: 'Bench Prog', departmentId: dept.id } });
  let ay = await prisma.academicYear.findFirst() || await prisma.academicYear.create({ data: { year: '2026-2027', isCurrent: true } });
  let sem = await prisma.semester.findFirst() || await prisma.semester.create({ data: { number: 1, programId: prog.id, academicYearId: ay.id } });
  let sec = await prisma.section.findFirst() || await prisma.section.create({ data: { name: 'A', semesterId: sem.id } });
  let sub = await prisma.subject.findFirst() || await prisma.subject.create({ data: { name: 'Bench Sub', code: 'BS101', credits: 3, semesterId: sem.id, branchId: branch.id } });

  let teacherUser = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  if (!teacherUser) {
    teacherUser = await prisma.user.create({ data: { name: 'T1', email: 't1@b.com', role: 'TEACHER', officialId: 'T1', passwordHash: 'hash', status: 'ACTIVE' } });
  }
  let teacherProf = await prisma.teacherProfile.findFirst({ where: { userId: teacherUser.id } });
  if (!teacherProf) {
    teacherProf = await prisma.teacherProfile.create({ data: { userId: teacherUser.id, departmentId: dept.id } });
  }

  let ca = await prisma.courseAssignment.findFirst();
  if (!ca) {
    ca = await prisma.courseAssignment.create({
      data: { subjectId: sub.id, sectionId: sec.id, teacherProfileId: teacherProf.id, academicYearId: ay.id }
    });
  }

  let uniqueCounter = Date.now();
  // --- SEEDING & READ LOOP ---
  for (const target of targetTiers) {
    if (userCount < target) {
      console.log(`Seeding up to ${target} users...`);
      const needed = target - userCount;
      const batchSize = 500;
      for (let i = 0; i < needed; i += batchSize) {
        const usersToCreate = [];
        const currentBatch = Math.min(batchSize, needed - i);
        for (let j = 0; j < currentBatch; j++) {
          const r = Math.random();
          const uid = uniqueCounter++;
          usersToCreate.push({
            name: `User ${uid}`,
            email: `u${uid}@bench.com`,
            officialId: `UID${uid}`,
            password: 'hash',
            role: r > 0.1 ? 'STUDENT' : 'TEACHER',
            status: 'ACTIVE'
          });
        }
        await prisma.user.createMany({ data: usersToCreate });
        userCount += currentBatch;
      }
      console.log(`Reached ${userCount} users.`);
    }

    // Run Read Benchmarks
    console.log(`\n--- READ BENCHMARKS @ ${target} USERS ---`);
    
    const queries = [
      { name: 'Student List', fn: () => prisma.user.findMany({ where: { role: 'STUDENT' }, take: 200, orderBy: { createdAt: 'desc' } }) },
      { name: 'Teacher List', fn: () => prisma.user.findMany({ where: { role: 'TEACHER' }, take: 200, orderBy: { createdAt: 'desc' } }) },
      { name: 'Approvals', fn: () => prisma.approval.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) },
      { name: 'Subjects', fn: () => prisma.subject.findMany({ take: 200, orderBy: { name: 'asc' } }) },
      { name: 'Resources', fn: () => prisma.resource.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) },
      { name: 'Chats', fn: () => prisma.chat.findMany({ take: 200, orderBy: { createdAt: 'desc' }, include: { messages: true } }) },
      { name: 'Notifications', fn: () => prisma.notification.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) },
      { name: 'Course Assignments', fn: () => prisma.courseAssignment.findMany({ take: 200, include: { subject: true, section: true } }) },
      { name: 'Attendance', fn: () => prisma.attendance.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) }
    ];

    for (const q of queries) {
      const t0 = performance.now();
      await q.fn();
      const t1 = performance.now();
      console.log(`${q.name}: ${(t1 - t0).toFixed(2)}ms`);
    }
  }

  // --- CONCURRENT WRITE STRESS TEST ---
  console.log("\n--- CONCURRENT WRITE STRESS TEST (10k DB State) ---");
  const concurrentWriters = 50; // High concurrency for SQLite
  console.log(`Firing ${concurrentWriters} simultaneous write requests...`);
  
  let students = await prisma.user.findMany({ where: { role: 'STUDENT' }, take: concurrentWriters });
  if (students.length < concurrentWriters) {
      students = await prisma.user.findMany({ take: concurrentWriters });
  }

  for(let i=0; i<students.length; i++) {
     let prof = await prisma.studentProfile.findUnique({where:{userId: students[i].id}});
     if(!prof) {
         await prisma.studentProfile.create({data:{userId: students[i].id}});
     }
  }
  let studentProfiles = await prisma.studentProfile.findMany({ take: concurrentWriters });

  const promises = [];
  let errorCount = 0;
  const startStress = performance.now();
  let maxTime = 0;

  for (let i = 0; i < concurrentWriters; i++) {
    const prof = studentProfiles[i % studentProfiles.length];
    
    if (i % 2 === 0) {
      // Simulate marking attendance
      const p = new Promise(async (resolve) => {
        const t0 = performance.now();
        try {
          await prisma.attendance.create({
            data: {
              date: new Date(Date.now() + i*1000), // Avoid unique constraint collision on date
              status: 'PRESENT',
              courseAssignmentId: ca.id,
              studentProfileId: prof.id
            }
          });
        } catch(e) {
          console.error(e.message);
          errorCount++;
        }
        const t1 = performance.now();
        if (t1 - t0 > maxTime) maxTime = t1 - t0;
        resolve();
      });
      promises.push(p);
    } else {
      // Simulate sending a chat message
      const p = new Promise(async (resolve) => {
        const t0 = performance.now();
        try {
          await prisma.chat.create({
            data: {
              title: `Stress Chat ${i}`,
              userId: prof.userId,
              messages: {
                  create: {
                      role: 'user',
                      content: 'Hello AI'
                  }
              }
            }
          });
        } catch(e) {
          console.error(e.message);
          errorCount++;
        }
        const t1 = performance.now();
        if (t1 - t0 > maxTime) maxTime = t1 - t0;
        resolve();
      });
      promises.push(p);
    }
  }

  await Promise.all(promises);
  const endStress = performance.now();

  console.log(`\nStress Test Completed in ${(endStress - startStress).toFixed(2)}ms`);
  console.log(`Slowest single write took: ${maxTime.toFixed(2)}ms`);
  console.log(`Write Errors (e.g. SQLITE_BUSY): ${errorCount}`);
  
  if (errorCount === 0) {
    console.log("Verdict: WAL mode successfully absorbed high concurrency (0 errors).");
  } else {
    console.log(`Verdict: Write contention detected. Failed to process ${errorCount} queries.`);
  }

  console.log("\nBenchmarks Completed.");
}

runBenchmarks()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
