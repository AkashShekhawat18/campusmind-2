const prisma = require('./src/utils/prisma');
const fs = require('fs');

async function main() {
  try {
    const rawData = fs.readFileSync('exported_users.json', 'utf8');
    const users = JSON.parse(rawData);
    
    console.log(`Importing ${users.length} users...`);
    
    let imported = 0;
    for (const user of users) {
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: user,
          create: user
        });
        imported++;
      } catch (err) {
        console.error(`Error importing user ${user.email}:`, err.message);
      }
    }
    
    console.log(`Successfully imported ${imported} users.`);
  } catch (err) {
    console.error('Error in import script:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
