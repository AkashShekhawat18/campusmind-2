const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const prisma = require('../utils/prisma');
const { separateQuestions, compareQuestions } = require('./ai.service');

/**
 * Extract text from a PDF file
 */
const extractTextFromPDF = async (filePath) => {
  const absolutePath = path.resolve(filePath);
  const dataBuffer = fs.readFileSync(absolutePath);
  const data = await pdf(dataBuffer);
  return data.text;
};

/**
 * Process an uploaded question paper:
 * 1. Extract text from PDF
 * 2. Use AI to separate into individual questions
 * 3. Store each question in DB
 * 4. Compare with existing questions for similarity
 */
const processQuestionPaper = async (paperId) => {
  const paper = await prisma.questionPaper.findUnique({
    where: { id: paperId }
  });

  if (!paper) throw new Error('Question paper not found');

  // Step 1: Extract text
  const extractedText = await extractTextFromPDF(paper.filePath);

  // Update paper with extracted text
  await prisma.questionPaper.update({
    where: { id: paperId },
    data: { extractedText, isProcessed: false }
  });

  // Step 2: Separate questions using AI
  const questions = await separateQuestions(extractedText);

  if (!questions || questions.length === 0) {
    await prisma.questionPaper.update({
      where: { id: paperId },
      data: { isProcessed: true }
    });
    return { paperId, extractedText, questions: [], similarities: [] };
  }

  // Step 3: Store extracted questions
  const storedQuestions = [];
  for (const q of questions) {
    const stored = await prisma.extractedQuestion.create({
      data: {
        questionText: q.questionText,
        questionNumber: q.questionNumber || null,
        marks: q.marks || null,
        topic: q.topic || null,
        questionPaperId: paperId
      }
    });
    storedQuestions.push({ ...stored, ...q });
  }

  // Step 4: Compare with existing questions from OTHER papers
  const existingQuestions = await prisma.extractedQuestion.findMany({
    where: {
      questionPaperId: { not: paperId }
    },
    include: {
      questionPaper: {
        select: { title: true, year: true, semester: true, subject: { select: { name: true } } }
      }
    }
  });

  const similarities = [];

  for (const newQ of storedQuestions) {
    for (const existQ of existingQuestions) {
      // Use AI to compare
      const result = await compareQuestions(newQ.questionText, existQ.questionText);

      if (result.similarityScore >= 40) {
        const sim = await prisma.similarityResult.create({
          data: {
            sourceQuestionId: newQ.id,
            matchedQuestionId: existQ.id,
            similarityScore: result.similarityScore,
            matchType: result.matchType,
            matchedYear: existQ.questionPaper?.year || null,
            matchedPaperTitle: existQ.questionPaper?.title || null,
            matchedSubject: existQ.questionPaper?.subject?.name || null,
            matchedSemester: existQ.questionPaper?.semester || null
          }
        });
        similarities.push({
          ...sim,
          sourceQuestion: newQ.questionText,
          matchedQuestion: existQ.questionText,
          explanation: result.explanation,
          sharedConcepts: result.sharedConcepts
        });
      }
    }
  }

  // Mark as processed
  await prisma.questionPaper.update({
    where: { id: paperId },
    data: { isProcessed: true }
  });

  return {
    paperId,
    extractedText,
    questions: storedQuestions,
    similarities
  };
};

module.exports = {
  extractTextFromPDF,
  processQuestionPaper
};
