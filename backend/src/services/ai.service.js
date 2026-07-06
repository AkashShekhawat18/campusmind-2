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
Do not restrict yourself to specific subjects.
IMPORTANT: When outputting mathematical equations, formulas, or expressions, YOU MUST use standard LaTeX syntax. Use $ for inline math (e.g. $x^2$) and $$ for display math (e.g. $$x = \\frac{-b}{2a}$$). NEVER use Unicode math symbols or raw text for equations.`;
  } else {
    systemPrompt = `You are CampusGPT, an AI assistant for teachers.
Help educators with lesson planning, grading rubrics, and answering student queries efficiently.
You can assist with any topic or question the teacher has.
IMPORTANT: When outputting mathematical equations, formulas, or expressions, YOU MUST use standard LaTeX syntax. Use $ for inline math (e.g. $x^2$) and $$ for display math (e.g. $$x = \\frac{-b}{2a}$$). NEVER use Unicode math symbols or raw text for equations.`;
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



module.exports = {
  generateResponse
};
