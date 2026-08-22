const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function runAdvancedTests() {
  console.log("=== MALPHOR DB Final Verification ===");

  // 3. PostgreSQL WAL Check
  console.log("\n--- 3. POSTGRESQL WAL LEVEL ---");
  try {
    const walResult = await prisma.$queryRawUnsafe("SELECT current_setting('wal_level') as wal_level;");
    console.log(walResult);
  } catch (err) {
    console.log("Could not read wal_level:", err.message);
  }

  const userCount = await prisma.user.count();
  console.log(`\nCurrent User Count: ${userCount}`);
  
  if (userCount < 10000) {
      console.log("Not enough users to run benchmark at 10k! Run seed first.");
      process.exit(1);
  }

  // 4. Read Benchmark Medians (5 iterations)
  console.log("\n--- 4. READ BENCHMARKS (5 Iterations @ 10,000 Users) ---");
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
    const times = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      await q.fn();
      const t1 = performance.now();
      times.push(t1 - t0);
    }
    console.log(`${q.name}: Median ${getMedian(times).toFixed(2)}ms (Runs: ${times.map(t=>t.toFixed(2)).join(', ')})`);
  }

  // 1. Stress Tests at 100, 250, 500
  console.log("\n--- 1. CONCURRENT WRITE STRESS TEST (Ceiling Search) ---");
  
  let students = await prisma.user.findMany({ where: { role: 'STUDENT' }, take: 500 });
  if (students.length < 500) {
      students = await prisma.user.findMany({ take: 500 });
  }

  const ca = await prisma.courseAssignment.findFirst();

  let studentProfiles = await prisma.studentProfile.findMany({ take: 500 });
  
  const targetTiers = [100, 250, 500];

  for (const concurrentWriters of targetTiers) {
      console.log(`\n>> Testing ${concurrentWriters} simultaneous write requests...`);
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
                  date: new Date(Date.now() + i*1000 + concurrentWriters*100000), 
                  status: 'PRESENT',
                  courseAssignmentId: ca.id,
                  studentProfileId: prof.id
                }
              });
            } catch(e) {
              if (e.code === 'P2024' || e.message.includes('too many clients') || e.message.includes('timeout')) errorCount++;
              else errorCount++; // Count all errors
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
                      create: { role: 'user', content: 'Hello AI' }
                  }
                }
              });
            } catch(e) {
              if (e.code === 'P2024' || e.message.includes('too many clients') || e.message.includes('timeout')) errorCount++;
              else errorCount++;
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

      console.log(`Total Elapsed Time: ${(endStress - startStress).toFixed(2)}ms`);
      console.log(`Slowest single write: ${maxTime.toFixed(2)}ms`);
      console.log(`Connection / Timeout Errors: ${errorCount}`);
  }

  console.log("\nTests Complete.");
}

runAdvancedTests()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
