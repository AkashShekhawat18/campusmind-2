const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
      admin = await prisma.user.create({ data: { name: 'Admin', email: 'admin2@campusmind.com', role: 'ADMIN', officialId: 'ADM1', password: 'hash', status: 'ACTIVE' } });
  }

  const token = jwt.sign(
    { id: admin.id, role: 'ADMIN', email: admin.email },
    'your_jwt_secret',
    { expiresIn: '1h' }
  );

  console.log("Requesting GET /api/admin/users?limit=9999");
  const res = await fetch('http://localhost:5000/api/admin/users?limit=9999', {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  console.log('Status:', res.status);
  if (Array.isArray(data)) {
      console.log('Returned Array Length:', data.length);
      console.log('Is Capped at 200?:', data.length <= 200);
  } else if (data && Array.isArray(data.users)) {
      console.log('Returned Array Length:', data.users.length);
      console.log('Is Capped at 200?:', data.users.length <= 200);
  } else {
      console.log('Response:', data);
  }
}

test().catch(console.error);
