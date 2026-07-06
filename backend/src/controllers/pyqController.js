const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
const FormData = require('form-data');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.uploadPYQ = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    
    // 1. Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.originalname}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resources')
      .upload(fileName, file.buffer, { contentType: file.mimetype });
      
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(fileName);
    
    // 2. Call AI Service for extraction
    const form = new FormData();
    form.append('file', file.buffer, file.originalname);
    
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/pyq/extract`, form, {
      headers: { ...form.getHeaders() }
    });
    
    const questions = aiResponse.data.questions || [];
    
    // 3. AI Auto Classification (Simulated metadata extraction from first question or text)
    // In a real flow, you'd have an AI endpoint that classifies the whole text first.
    // We will create the paper in DB.
    const pyqPaper = await prisma.pYQPaper.create({
      data: {
        title: req.body.title || 'Auto-Detected Title',
        collegeName: req.body.collegeName || 'Unknown College',
        subjectName: req.body.subjectName || 'Unknown Subject',
        semester: req.body.semester ? parseInt(req.body.semester) : null,
        examType: req.body.examType || null,
        year: req.body.year ? parseInt(req.body.year) : new Date().getFullYear(),
        fileUrl: publicUrl,
        originalFileName: file.originalname,
        uploadedById: req.user.id,
        isProcessed: true,
        status: 'COMPLETED'
      }
    });
    
    // 4. Save extracted questions
    const questionPromises = questions.map(q => {
      return prisma.pYQQuestion.create({
        data: {
          paperId: pyqPaper.id,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          marks: q.marks,
          topic: q.topic,
          subParts: q.subParts,
          latex: q.latex,
          diagramContext: q.diagramContext,
          metadata: q.metadata ? {
            create: {
              concept: q.metadata.concept,
              subconcept: q.metadata.subconcept,
              questionIntent: q.metadata.questionIntent,
              requiredFormula: q.metadata.requiredFormula,
              solvingMethod: q.metadata.solvingMethod,
              difficulty: q.metadata.difficulty,
              logic: q.metadata.logic
            }
          } : undefined
        }
      });
    });
    
    await Promise.all(questionPromises);
    
    res.status(201).json({ message: 'PYQ Uploaded and Processed successfully', paperId: pyqPaper.id });
  } catch (error) {
    console.error('PYQ Upload Error:', error);
    res.status(500).json({ error: 'Failed to process PYQ' });
  }
};

exports.getPYQLibrary = async (req, res) => {
  try {
    const filters = {};
    if (req.query.subjectName) filters.subjectName = { contains: req.query.subjectName, mode: 'insensitive' };
    if (req.query.year) filters.year = parseInt(req.query.year);
    
    const papers = await prisma.pYQPaper.findMany({
      where: filters,
      include: {
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { year: 'desc' }
    });
    
    res.status(200).json(papers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PYQ library' });
  }
};

exports.analyzeCurrentPaper = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    
    // 1. Extract questions from current paper
    const form = new FormData();
    form.append('file', file.buffer, file.originalname);
    
    const extractResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/pyq/extract`, form, {
      headers: { ...form.getHeaders() }
    });
    
    const currentQuestions = extractResponse.data.questions || [];
    
    // 2. Fetch all historical questions to compare against
    const historicalQuestions = await prisma.pYQQuestion.findMany({
      include: {
        metadata: true,
        paper: {
          select: { title: true, subjectName: true, year: true }
        }
      }
    });
    
    // Format historical pool for AI service
    const formattedPool = historicalQuestions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      metadata: q.metadata || {}
    }));
    
    // 3. Send to AI Similarity Engine
    const simResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/pyq/similarity`, {
      questions: currentQuestions,
      historical_pool: formattedPool
    });
    
    res.status(200).json(simResponse.data);
  } catch (error) {
    console.error('Analyze Paper Error:', error);
    res.status(500).json({ error: 'Failed to analyze paper' });
  }
};

exports.replaceQuestion = async (req, res) => {
  try {
    const { originalQuestion } = req.body;
    
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/pyq/replace`, originalQuestion);
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Replace Question Error:', error);
    res.status(500).json({ error: 'Failed to replace question' });
  }
};

exports.generatePDF = async (req, res) => {
  try {
    const { questions, title } = req.body;
    
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/pyq/generate-pdf`, { questions, title }, {
      responseType: 'arraybuffer'
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="updated_${Date.now()}.pdf"`);
    res.send(response.data);
  } catch (error) {
    console.error('Generate PDF Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
