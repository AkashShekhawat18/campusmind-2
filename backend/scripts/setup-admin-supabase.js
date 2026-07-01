const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const prisma = new PrismaClient();

async function setup() {
  const email = 'dhruvj9928@gmail.com';
  const password = 'dhruv@123';

  console.log('Trying to log in to get ID...');
  let userId;
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  
  if (loginError || !loginData.user) {
     console.error('Failed to log in existing supabase user:', loginError?.message);
     return;
  }
  
  userId = loginData.user.id;
  console.log(`Supabase User ID: ${userId}`);

  // Check if old admin exists and delete
  const oldAdmin = await prisma.user.findUnique({ where: { email } });
  if (oldAdmin && oldAdmin.id !== userId) {
    console.log('Deleting old admin from SQLite to prevent unique constraint errors...');
    await prisma.user.delete({ where: { email } });
  }

  // Create new admin
  console.log('Upserting admin in SQLite with new ID...');
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      role: 'ADMIN',
      status: 'ACTIVE',
      password: 'SUPABASE_MANAGED'
    },
    create: {
      id: userId,
      email: email,
      name: 'System Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      password: 'SUPABASE_MANAGED'
    }
  });

  console.log('✅ Admin setup complete! You can now log in with dhruvj9928@gmail.com / dhruv@123');
}

setup().catch(console.error).finally(() => prisma.$disconnect());
