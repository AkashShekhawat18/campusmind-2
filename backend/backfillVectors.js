const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function backfillPYQs() {
  console.log("Starting Vector DB Backfill...");
  try {
    const papers = await prisma.pYQPaper.findMany({
      include: {
        questions: {
          include: {
            metadata: true
          }
        }
      }
    });

    console.log(`Found ${papers.length} papers in database.`);

    for (const paper of papers) {
      console.log(`Indexing paper: ${paper.title} (${paper.id})...`);
      
      const formattedQuestions = paper.questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        marks: q.marks,
        topic: q.topic,
        latex: q.latex,
        metadata: q.metadata ? {
          concept: q.metadata.concept,
          difficulty: q.metadata.difficulty,
          logic: q.metadata.logic
        } : {}
      }));

      try {
        await axios.post(`${AI_SERVICE_URL}/api/ai/pyq/index`, {
          paperId: paper.id,
          questions: formattedQuestions
        });
        console.log(`✓ Indexed paper: ${paper.title}`);
      } catch (err) {
        console.error(`✗ Failed to index paper: ${paper.title}`, err.response?.data || err.message);
      }
    }
    
    console.log("Backfill completed successfully!");
  } catch (error) {
    console.error("Backfill failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillPYQs();
