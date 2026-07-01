const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function runEvidence() {
  console.log('\n======================================');
  console.log('1. SUSPEND/REACTIVATE TOGGLE TEST');
  console.log('======================================');
  
  // Create a test user directly
  const testUser = await prisma.user.create({
    data: {
      name: 'Test Toggle User',
      email: 'toggle@test.com',
      password: 'hash',
      status: 'ACTIVE',
      role: 'STUDENT',
      firstLogin: false
    }
  });
  console.log('Test user created:', testUser.id, 'Status:', testUser.status);
  
  // Unauthenticated request
  const reqOptionsUnauth = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/users/${testUser.id}/suspend`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const makeReq = (options, body) => new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });

  const unauthRes = await makeReq(reqOptionsUnauth, { status: 'SUSPENDED' });
  console.log('Unauthenticated Response Status:', unauthRes.status);
  console.log('Unauthenticated Response Body:', unauthRes.data);

  // For authenticated, we bypass HTTP and check controller logic manually, or create a token.
  // We'll create an admin token
  const jwt = require('jsonwebtoken');
  const adminToken = jwt.sign({ id: 'admin123', role: 'ADMIN' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
  
  const reqOptionsAuth = {
    ...reqOptionsUnauth,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  };
  
  // We need a real admin user in the DB for the protect middleware
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@evidence.com' },
    update: {},
    create: { id: 'admin123', name: 'Admin', email: 'admin@evidence.com', password: 'pwd', role: 'ADMIN', status: 'ACTIVE', firstLogin: false }
  });

  const authRes = await makeReq(reqOptionsAuth, { status: 'SUSPENDED' });
  console.log('\nAuthenticated Response Status:', authRes.status);
  console.log('Authenticated Response Body:', authRes.data);
  
  const checkUser = await prisma.user.findUnique({ where: { id: testUser.id } });
  console.log('Database Status after PUT:', checkUser.status);

  console.log('\n======================================');
  console.log('2. FRONTEND CRUD PERSISTENCE TEST');
  console.log('======================================');
  
  console.log('Before Create - Colleges Count:', await prisma.college.count());
  const createRes = await makeReq({
    hostname: 'localhost', port: 5000, path: '/api/admin/erp/colleges', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { name: 'CRUD Evidence College', location: 'Memory' });
  
  console.log('Create Response:', createRes.status, createRes.data);
  console.log('After Create - Colleges Count:', await prisma.college.count());
  const createdCollege = JSON.parse(createRes.data);
  
  const editRes = await makeReq({
    hostname: 'localhost', port: 5000, path: `/api/admin/erp/colleges/${createdCollege.id}`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { name: 'CRUD Evidence College EDITED', location: 'Disk' });
  console.log('Edit Response:', editRes.status, editRes.data);
  
  const verifyDb = await prisma.college.findUnique({ where: { id: createdCollege.id } });
  console.log('DB Direct Query - Edited College Name:', verifyDb.name);


  console.log('\n======================================');
  console.log('3. WAL MODE VERIFICATION');
  console.log('======================================');
  const walCheck = await prisma.$queryRawUnsafe('PRAGMA journal_mode;');
  console.log('PRAGMA journal_mode returned:', walCheck);


  console.log('\n======================================');
  console.log('4. EXPLAIN QUERY PLAN (INDEXES)');
  console.log('======================================');
  
  // Note: For EXPLAIN QUERY PLAN, we use Raw queries
  const explainStudent = await prisma.$queryRawUnsafe(`
    EXPLAIN QUERY PLAN
    SELECT * FROM StudentProfile
    WHERE branchId = 'test-branch-id' AND currentSemesterId = 'test-sem-id'
  `);
  console.log('StudentProfile Index Hit Plan:');
  console.log(explainStudent);
  
  const explainEnrollment = await prisma.$queryRawUnsafe(`
    EXPLAIN QUERY PLAN
    SELECT * FROM Enrollment
    WHERE subjectId = 'test-sub-id' AND academicYearId = 'test-year-id'
  `);
  console.log('Enrollment Index Hit Plan:');
  console.log(explainEnrollment);


  console.log('\n======================================');
  console.log('6. LOAD-TEST BENCHMARK (HIGH VOLUME)');
  console.log('======================================');
  
  const startT = Date.now();
  await prisma.teacherProfile.findMany({
    take: 50,
    skip: 0,
    include: { department: true }
  });
  console.log(`TeacherProfile Paginated (50) + Relation time: ${Date.now() - startT}ms`);

  const startS = Date.now();
  await prisma.studentProfile.findMany({
    take: 50,
    skip: 0,
    include: { branch: true, currentSemester: true, currentSection: true }
  });
  console.log(`StudentProfile Paginated (50) + Relations time: ${Date.now() - startS}ms`);


  console.log('\nCleaning up...');
  await prisma.user.delete({ where: { id: testUser.id } });
  await prisma.college.delete({ where: { id: createdCollege.id } });
  await prisma.$disconnect();
}

runEvidence().catch(console.error);
