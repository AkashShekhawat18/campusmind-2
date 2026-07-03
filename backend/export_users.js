const prisma = require('./src/utils/prisma');
const fs = require('fs');

async function main() {
  try {
    const users = await prisma.user.findMany();
    fs.writeFileSync('exported_users.json', JSON.stringify(users, null, 2));
    console.log(`Successfully exported ${users.length} users.`);
  } catch (err) {
    console.error('Error exporting users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
