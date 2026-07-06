const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const email = process.argv[2] || 'student@campusmind.ai';
  try {
    console.log(`Confirming email for ${email}...`);
    
    // Update auth.users to set email_confirmed_at and confirmed_at
    const result = await prisma.$executeRawUnsafe(`
      UPDATE auth.users 
      SET email_confirmed_at = NOW() 
      WHERE email = '${email}'
    `);
    
    console.log(`Success! Updated records in Supabase auth.users.`);
  } catch (e) {
    console.error('Update failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
