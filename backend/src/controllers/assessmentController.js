const prisma = require('../utils/prisma');
const Groq = require('groq-sdk');
const { streamResponse, getModelConfig, getProviderKey } = require('../services/aiRouter.service');

// Create a new Assessment with its Questions and Options
const createAssessment = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { 
      title, description, type, subject, timeLimit, totalMarks, 
      openDate, dueDate, dueTime, allowLate, latePenalty, 
      autoPublish, autoClose, assignMode, class: classVal, section,
      questions 
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and Type are required' });
    }

    // Determine initial status based on config
    let initialStatus = 'DRAFT';
    if (autoPublish) {
      initialStatus = 'SCHEDULED';
      // If openDate is now or past, it could technically be ACTIVE, but for simplicity:
      if (openDate && new Date(openDate) <= new Date()) {
        initialStatus = 'ACTIVE';
      }
    }

    // Use a transaction to create everything linked
    const assessment = await prisma.$transaction(async (tx) => {
      const newAssessment = await tx.assessment.create({
        data: {
          teacherId,
          title,
          description,
          type,
          status: initialStatus,
          subject,
          timeLimit: timeLimit || null,
          totalMarks: totalMarks || 0,
          openDate: openDate ? new Date(openDate) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          dueTime: dueTime || null,
          allowLate: allowLate || false,
          latePenalty: latePenalty || null,
          autoPublish: autoPublish || false,
          autoClose: autoClose || false,
          assignMode: assignMode || 'ALL',
          class: classVal,
          section
        }
      });

      if (questions && Array.isArray(questions) && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const newQ = await tx.assessmentQuestion.create({
            data: {
              assessmentId: newAssessment.id,
              order: i,
              type: q.type,
              text: q.text,
              marks: q.marks || 1,
              difficulty: q.difficulty || 'medium',
              bloomLevel: q.bloomLevel,
              topic: q.topic,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation
            }
          });

          if (q.options && Array.isArray(q.options) && q.options.length > 0) {
            const optionData = q.options.map((opt, optIdx) => ({
              questionId: newQ.id,
              text: opt.text,
              isCorrect: opt.isCorrect || false,
              order: optIdx
            }));
            await tx.assessmentOption.createMany({
              data: optionData
            });
          }
        }
      }

      return newAssessment;
    });

    res.status(201).json({ message: 'Assessment created successfully', assessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Server error while creating assessment' });
  }
};

const getTeacherAssessments = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { status } = req.query; // optional filter

    const whereClause = { teacherId };
    if (status) {
      whereClause.status = status;
    }

    const assessments = await prisma.assessment.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(assessments);
  } catch (error) {
    console.error('Error fetching teacher assessments:', error);
    res.status(500).json({ error: 'Server error while fetching assessments' });
  }
};

const getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Teachers can only view their own OR students can view active ones (but this is teacher dashboard)
    if (assessment.teacherId !== teacherId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to view this assessment' });
    }

    res.status(200).json(assessment);
  } catch (error) {
    console.error('Error fetching assessment by id:', error);
    res.status(500).json({ error: 'Server error while fetching assessment' });
  }
};

const updateAssessmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const teacherId = req.user.id;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.teacherId !== teacherId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to update this assessment' });
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({ message: 'Status updated', assessment: updated });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Server error while updating status' });
  }
};

const chatStream = async (req, res) => {
  try {
    const { message, history } = req.body;
    // We can default to a fast model if not provided, or standard groq model. 
    // Usually 'llama-3.1-70b-versatile' or 'gemini-1.5-flash'. We'll just ask for the best available.
    const modelConfig = await getModelConfig('llama-3.1-70b-versatile', message);

    const systemPrompt = `You are the Assessment Assistant, a highly specialized AI designed exclusively to help teachers create, manage, and evaluate assessments, quizzes, test papers, and assignments. DO NOT act like CampusGPT. DO NOT answer general knowledge questions or assist with general tasks outside the context of assessments. If a user asks something unrelated, politely but firmly state that your capabilities are strictly limited to assessments. Always format your responses in clean Markdown.`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt }
    ];

    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        formattedMessages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    formattedMessages.push({ role: 'user', content: message });

    // Stream the response back to the client
    await streamResponse(req, res, modelConfig, formattedMessages);

  } catch (error) {
    console.error('Error in Assessment Assistant chatStream:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process AI response' });
    }
  }
};

const generateQuiz = async (req, res) => {
  try {
    const { topic, questionCount } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const count = parseInt(questionCount) || 10;
    const modelConfig = await getModelConfig('llama-3.1-70b-versatile');
    const keyObject = await getProviderKey(modelConfig.providerId);
    
    if (!keyObject) {
      return res.status(500).json({ error: 'No active AI API keys available' });
    }
    
    const groq = new Groq({ apiKey: keyObject.key });
    
    const prompt = `You are a strict JSON output generator. Generate ${count} multiple choice questions about "${topic}".
    The output MUST be a valid JSON object with a single key "questions" containing an array of objects. Do not include markdown code blocks, do not include explanations outside the JSON.
    Each object in the "questions" array must have this exact structure:
    {
      "id": "uuid-string (generate a random string)",
      "type": "mcq",
      "text": "The question text",
      "marks": 1,
      "difficulty": "easy" | "medium" | "hard",
      "options": [
        { "id": "a", "text": "Option A text" },
        { "id": "b", "text": "Option B text" },
        { "id": "c", "text": "Option C text" },
        { "id": "d", "text": "Option D text" }
      ],
      "correctAnswer": "a" (must match one of the option ids)
    }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: modelConfig.modelName,
      temperature: 0.2,
      response_format: { type: "json_object" } // Using json_object might require the prompt to ask for an object containing the array.
    });

    let resultString = completion.choices[0]?.message?.content || '[]';
    
    // If we used json_object, groq wants the result to be an object. Let's parse it.
    // To be safe against groq json_object requirements, actually let's just parse the string and find the array.
    let questions = [];
    try {
      const parsed = JSON.parse(resultString);
      if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      } else {
        // Find the first array in the values
        for (const key in parsed) {
          if (Array.isArray(parsed[key])) {
            questions = parsed[key];
            break;
          }
        }
      }
    } catch (e) {
      // fallback regex to find array
      const match = resultString.match(/\[[\s\S]*\]/);
      if (match) {
        questions = JSON.parse(match[0]);
      }
    }

    res.status(200).json({ questions });

  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
};

module.exports = {
  createAssessment,
  getTeacherAssessments,
  getAssessmentById,
  updateAssessmentStatus,
  chatStream,
  generateQuiz
};
