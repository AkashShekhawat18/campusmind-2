require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findFirst();
    const paper = await prisma.pYQPaper.create({
      data: {
        title: 'Test Paper',
        uploadedById: user.id,
        fileUrl: 'test',
        originalFileName: 'test'
      }
    });
    console.log('Created paper:', paper.id);
    
    // Add a question to test cascading
    await prisma.pYQQuestion.create({
      data: {
        paperId: paper.id,
        questionText: 'Test Question',
        questionNumber: '1',
      }
    });
    console.log('Added question to test cascade');

    await prisma.pYQPaper.delete({ where: { id: paper.id } });
    console.log('Deleted successfully');
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
