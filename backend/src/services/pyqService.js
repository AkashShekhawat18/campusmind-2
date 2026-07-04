const fs = require('fs');
const path = require('path');
const prisma = require('../utils/prisma');
const axios = require('axios');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Process an uploaded question paper by proxying to the Python ai-service.
 */
const processQuestionPaper = async (paperId) => {
  const paper = await prisma.questionPaper.findUnique({
    where: { id: paperId }
  });

  if (!paper) throw new Error('Question paper not found');

  console.log(`\n=== Processing Paper: "${paper.title}" (${paperId}) ===`);
  console.log(`File: ${paper.filePath}`);

  const isRemoteFile = paper.filePath && paper.filePath.startsWith('http');
  const absolutePath = isRemoteFile ? paper.filePath : path.resolve(paper.filePath);

  if (!isRemoteFile && !fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    await prisma.questionPaper.update({
      where: { id: paperId },
      data: { isProcessed: true, extractedText: 'ERROR: File not found' }
    });
    return { paperId, extractedText: 'ERROR: File not found', questions: [], similarities: [] };
  }

  let extractedText = '';
  let storedQuestions = [];
  let similarities = [];

  try {
    // 1. Send file to Python AI Service for extraction (OCR + Extraction + Embedding)
    console.log('Sending file to AI Microservice for extraction...');
    const formData = new FormData();
    
    if (isRemoteFile) {
      const response = await axios.get(absolutePath, { responseType: 'stream' });
      formData.append('file', response.data, paper.originalFileName);
    } else {
      formData.append('file', fs.createReadStream(absolutePath));
    }

    const extractRes = await axios.post(`${AI_SERVICE_URL}/api/ai/pyq/extract`, formData, {
      headers: { ...formData.getHeaders() },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 300000 // 5 minutes timeout for large PDFs
    });

    const aiData = extractRes.data;
    if (aiData.status !== 'success') {
      throw new Error('AI Service failed to extract questions');
    }

    const extractedQuestions = aiData.questions || [];
    console.log(`AI Service extracted ${extractedQuestions.length} questions.`);
    extractedText = `Extracted via Python AI Service (Total: ${extractedQuestions.length} questions)`;

    // 2. Save extracted questions to Database
    console.log('Saving extracted questions to database...');
    for (const q of extractedQuestions) {
      const stored = await prisma.extractedQuestion.create({
        data: {
          questionText: q.questionText,
          questionNumber: q.questionNumber ? String(q.questionNumber) : null,
          marks: q.marks ? parseInt(q.marks) : null,
          topic: q.topic || null,
          embedding: q.embedding ? JSON.stringify(q.embedding) : null,
          questionPaperId: paperId
        }
      });
      // Attach ID so we can map similarities back later
      q.id = stored.id;
      storedQuestions.push(stored);
    }

    // 3. Update Paper
    await prisma.questionPaper.update({
      where: { id: paperId },
      data: { extractedText, isProcessed: false }
    });

    // 4. If there are questions, fetch historical pool and run similarity
    if (extractedQuestions.length > 0) {
      console.log('Fetching historical pool for similarity matching...');
      const existingQuestions = await prisma.extractedQuestion.findMany({
        where: {
          questionPaperId: { not: paperId },
          questionPaper: { uploadType: 'HISTORICAL' }
        },
        include: {
          questionPaper: {
            select: { title: true, year: true, semester: true, subject: { select: { name: true } } }
          }
        }
      });

      console.log(`Found ${existingQuestions.length} historical questions. Sending to AI Service...`);
      
      // Clean up existing questions for payload to avoid huge requests
      const historicalPool = existingQuestions.map(eq => ({
        id: eq.id,
        embedding: eq.embedding ? JSON.parse(eq.embedding) : null,
        questionText: eq.questionText,
        matchedYear: eq.questionPaper?.year,
        matchedPaperTitle: eq.questionPaper?.title,
        matchedSubject: eq.questionPaper?.subject?.name
      })).filter(eq => eq.embedding);

      // We only send the newly extracted questions that have embeddings
      const newQuestionsPayload = extractedQuestions.filter(q => q.embedding);

      const simRes = await axios.post(`${AI_SERVICE_URL}/api/ai/pyq/similarity`, {
        questions: newQuestionsPayload,
        historical_pool: historicalPool
      }, {
        timeout: 120000 // 2 mins
      });

      if (simRes.data.status === 'success') {
        const simResults = simRes.data.similarityResults || [];
        console.log(`AI Service found ${simResults.length} similarity matches.`);

        // 5. Save similarity results
        for (const match of simResults) {
          const sim = await prisma.similarityResult.create({
            data: {
              sourceQuestionId: match.sourceQuestionId,
              matchedQuestionId: match.matchedQuestionId,
              similarityScore: match.similarityScore,
              matchType: match.matchType,
              matchedYear: match.matchedYear,
              matchedPaperTitle: match.matchedPaperTitle,
              matchedSubject: match.matchedSubject,
              matchedSemester: null
            }
          });
          similarities.push(sim);
        }

        // 6. Save analytics if needed (We could save the paper analytics returned by python here)
        if (simRes.data.analytics) {
          await prisma.paperAnalytics.create({
            data: {
              questionPaperId: paperId,
              totalQuestions: simRes.data.analytics.totalQuestions,
              uniqueCount: simRes.data.analytics.uniqueCount,
              repeatedCount: simRes.data.analytics.repeatedCount,
              overallSimilarity: simRes.data.analytics.overallSimilarity,
              topicDistribution: simRes.data.analytics.topicDistribution,
              yearDistribution: simRes.data.analytics.yearDistribution
            }
          });
        }
      }
    }

  } catch (error) {
    console.error('Extraction failed:', error.message);
    if (error.response) {
      console.error('AI Service response:', error.response.data);
    }
    extractedText = `ERROR: ${error.message}`;
  }

  // Mark as processed
  await prisma.questionPaper.update({
    where: { id: paperId },
    data: { extractedText, isProcessed: true }
  });

  console.log(`=== Processing Complete: ${storedQuestions.length} questions, ${similarities.length} similarities ===\n`);

  return {
    paperId,
    extractedText,
    questions: storedQuestions,
    similarities
  };
};

module.exports = {
  processQuestionPaper
};
