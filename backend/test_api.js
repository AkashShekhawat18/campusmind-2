require('dotenv').config();
const jwt = require('jsonwebtoken');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst();
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/pyq/chat/paper/b6336702-3aee-46fc-953f-a4c416537176',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, res => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => console.log('Response:', res.statusCode, data));
  });

  req.on('error', e => console.error('Request error:', e.message));
  req.write(JSON.stringify({message: 'test from server debug'}));
  req.end();
}

run().finally(() => prisma.$disconnect());
