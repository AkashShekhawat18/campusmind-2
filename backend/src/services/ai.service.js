const Groq = require('groq-sdk');

// Parse comma-separated keys from GROQ_API_KEYS
const getGroqKeys = () => {
  const keysStr = process.env.GROQ_API_KEYS || 'your_groq_key_1,your_groq_key_2';
  return keysStr.split(',').map(k => k.trim()).filter(k => k);
};

let currentKeyIndex = 0;

const generateResponse = async (message, mode = 'STUDENT', history = []) => {
  const keys = getGroqKeys();
  let attempts = 0;

  let systemPrompt = "";
  if (mode === 'STUDENT') {
    systemPrompt = `You are CampusGPT, a highly intelligent and supportive AI assistant for students.
Your goal is to help students learn, understand concepts, and debug code.
Be encouraging, clear, and concise. You can assist with any topic or question the student has.
Do not restrict yourself to specific subjects.`;
  } else {
    systemPrompt = `You are CampusGPT, an AI assistant for teachers.
Help educators with lesson planning, grading rubrics, and answering student queries efficiently.
You can assist with any topic or question the teacher has.`;
  }

  // Map frontend history to Groq (OpenAI style) format
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content: message }
  ];

  while (attempts < keys.length) {
    try {
      const groq = new Groq({ apiKey: keys[currentKeyIndex] });
      const completion = await groq.chat.completions.create({
        messages: messages,
        model: "llama-3.3-70b-versatile", // We use the massive 70B parameter model
        temperature: 0.7,
        max_tokens: 1024,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (err) {
      if (err.status === 429) {
        console.log(`Groq rate limit hit on key index ${currentKeyIndex}. Rotating...`);
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        attempts++;
        continue; // Try again with the new key
      }
      
      // If it's a different error, log it and break
      console.error("Groq Error:", err);
      break;
    }
  }

  // If we exhaust all keys or hit a non-429 error
  return "⚠️ All AI keys are currently rate-limited or unavailable. Please try again in a few seconds, or add more keys to GROQ_API_KEYS.";
};

/**
 * Generic Groq call with key rotation (reusable helper)
 */
const callGroq = async (messages, temperature = 0.7, maxTokens = 1024) => {
  const keys = getGroqKeys();
  let attempts = 0;

  while (attempts < keys.length) {
    try {
      const groq = new Groq({ apiKey: keys[currentKeyIndex] });
      const completion = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature,
        max_tokens: maxTokens,
      });
      return completion.choices[0]?.message?.content || "";
    } catch (err) {
      if (err.status === 429) {
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        attempts++;
        continue;
      }
      console.error("Groq Error:", err);
      break;
    }
  }
  return "⚠️ AI service temporarily unavailable. Please try again.";
};

/**
 * Rewrite a question while maintaining difficulty, topic, marks, and learning outcome
 */
const generateQuestionRewrite = async (question, constraints = {}) => {
  const { marks, topic, difficulty, learningOutcome } = constraints;
  
  const systemPrompt = `You are an expert academic question writer. Your task is to rewrite the given exam question to create a new, original version that tests the same concept but is worded differently.

CONSTRAINTS:
- Maintain the same difficulty level${difficulty ? `: ${difficulty}` : ''}
- Keep the same topic${topic ? `: ${topic}` : ''}
- Worth the same marks${marks ? `: ${marks} marks` : ''}
${learningOutcome ? `- Learning outcome: ${learningOutcome}` : ''}
- The rewritten question must NOT be a simple paraphrase — change the scenario, data, or approach
- Output ONLY the rewritten question, nothing else`;

  return callGroq([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Original question:\n${question}` }
  ], 0.8, 512);
};

/**
 * Question Paper Chatbot — answers questions ONLY about uploaded question papers
 */
const analyzeQuestionPaper = async (paperContext, userQuestion, history = []) => {
  const systemPrompt = `You are an AI assistant specialized in analyzing academic question papers. You have been given the full text of an uploaded question paper.

YOUR CAPABILITIES:
- Explain any question from the paper
- Generate model answers for questions
- Explain the topic/concept being tested
- Compare questions within the paper
- Generate alternative versions of questions
- Analyze the difficulty distribution

YOUR RESTRICTIONS:
- You must ONLY answer questions related to the uploaded question paper
- If the user asks something unrelated to the paper, politely decline and redirect them
- Always reference specific questions from the paper when relevant

QUESTION PAPER CONTENT:
---
${paperContext}
---`;

  const formattedHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));

  return callGroq([
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content: userQuestion }
  ], 0.7, 1024);
};

/**
 * Compare two questions semantically and return a similarity analysis
 */
const compareQuestions = async (question1, question2) => {
  const systemPrompt = `You are a semantic similarity analyzer for academic exam questions. Compare the two questions below and respond with ONLY a valid JSON object (no markdown, no code fences):

{
  "similarityScore": <number 0-100>,
  "matchType": "<EXACT|SEMANTIC|NONE>",
  "explanation": "<brief explanation of similarity>",
  "sharedConcepts": ["concept1", "concept2"]
}

Rules:
- EXACT: Questions are essentially the same with minor word changes (score 85-100)
- SEMANTIC: Questions test the same concept but are worded differently (score 40-84)  
- NONE: Questions are about different topics (score 0-39)`;

  const result = await callGroq([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Question 1:\n${question1}\n\nQuestion 2:\n${question2}` }
  ], 0.3, 512);

  try {
    return JSON.parse(result);
  } catch {
    return { similarityScore: 0, matchType: 'NONE', explanation: 'Could not parse similarity', sharedConcepts: [] };
  }
};

/**
 * Extract and separate questions from raw text using AI
 */
const separateQuestions = async (rawText) => {
  const systemPrompt = `You are an expert at parsing academic exam question papers. Given the raw text extracted from a PDF, identify and separate individual questions.

Respond with ONLY a valid JSON array (no markdown, no code fences). Each element:
{
  "questionNumber": "<e.g. 1a, 2, 3b>",
  "questionText": "<full question text>",
  "marks": <number or null if not specified>,
  "topic": "<inferred topic>"
}

Rules:
- Include sub-parts as separate entries (e.g., 1a, 1b)
- Ignore headers, instructions, and metadata
- If marks are mentioned (e.g., [5 marks]), extract them
- Infer the topic from the question content`;

  const result = await callGroq([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Raw question paper text:\n${rawText.substring(0, 6000)}` }
  ], 0.3, 2048);

  try {
    return JSON.parse(result);
  } catch {
    return [];
  }
};

module.exports = {
  generateResponse,
  generateQuestionRewrite,
  analyzeQuestionPaper,
  compareQuestions,
  separateQuestions
};
