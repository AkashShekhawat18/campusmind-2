const Groq = require('groq-sdk');

const getGroqKeys = () => {
  const keysStr = process.env.GROQ_API_KEYS || '';
  return keysStr.split(',').map(k => k.trim()).filter(k => k);
};

let currentKeyIndex = 0;

const WEBSITE_KB_TEXT = `
--- CAMPUSMIND WEBSITE KNOWLEDGE BASE ---
1. Login & Portals:
   - Student Login: /student/login
   - Teacher Login: /teacher/login
   - Admin Login: /admin/login
2. Registration:
   - Student Register: /student/register
   - Teacher Register: /teacher/register
3. Core Features:
   - CampusGPT: Multi-model RAG AI assistant, voice notes, document chat. (/student/dashboard/campus-gpt)
   - PYQ Question Paper Analyzer: 6D semantic similarity, question paper OCR, formula extraction, auto replacement generator. (/student/dashboard/pyq-analyzer)
   - Resource Marketplace: Institutional study notes, syllabus material, past exam paper solutions.
   - Admin ERP: System metrics, user approvals, institutional telemetry.
4. Mascot:
   - Malphor: Interactive 3D mascot & hybrid assistant guiding navigation and answering academic queries.
------------------------------------------
`;

const processMalphorRequest = async ({ message, history = [], fileContext = null, isWebsiteQuery = false }) => {
  const keys = getGroqKeys();
  if (keys.length === 0) {
    return {
      reply: "⚠️ Groq API key is missing. Please set GROQ_API_KEYS in backend/.env",
      mode: isWebsiteQuery ? 'WEBSITE_LLM' : 'ACADEMIC_AI'
    };
  }

  let systemPrompt = "";

  if (isWebsiteQuery) {
    systemPrompt = `You are Malphor, the intelligent support assistant for CampusMind.
Your goal is to assist users with navigating CampusMind, finding portals, understanding features, and accessing resources.

STRICT ACCURACY RULES:
1. Rely ONLY on the provided WEBSITE KNOWLEDGE BASE below. NEVER hallucinate website routes, features, or policies that do not exist.
2. If the exact answer is not in the knowledge base, state clearly what is available and direct them to contact support or explore the main navigation bar.
3. Be friendly, concise, encouraging, and clear.

${WEBSITE_KB_TEXT}`;
  } else {
    systemPrompt = `You are Malphor, the Hybrid Academic AI Assistant for CampusMind.
You excel at helping students and teachers with academic topics including:
- Homework solving, DBMS, Physics, Mathematics, Computer Science, Java, Python, AI
- Code writing, debugging, and code explanation
- Note summarization, PDF document analysis, Image OCR, Graph analysis
- MCQ and assignment generation

CRITICAL LATEX & FORMATTING RULES:
1. ALWAYS format ALL mathematical expressions, formulas, and symbols in LaTeX using dollar sign delimiters:
   - Inline math: $e.g. x^2 + y^2 = r^2$, $\\frac{a}{b}$, $\\int_0^\\infty f(x)dx$
   - Display/Block math: $$...$$ on separate lines
2. NEVER output unicode math symbols like "x²" or "a/b" outside of LaTeX dollar signs.
3. Wrap code in syntax-highlighted code blocks (e.g. \`\`\`python ... \`\`\`).
4. Be thorough, clear, structured, and helpful.`;
  }

  if (fileContext) {
    systemPrompt += `\n\n--- ATTACHED FILE / OCR CONTEXT ---\n${fileContext}\n-----------------------------------\nPlease analyze and utilize the above uploaded file/image context to answer the user's inquiry.`;
  }

  // Format message history
  const formattedHistory = (history || []).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content: message || 'Please analyze this.' }
  ];

  let attempts = 0;
  while (attempts < keys.length) {
    try {
      const groq = new Groq({ apiKey: keys[currentKeyIndex] });
      const completion = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: 1200,
      });

      const reply = completion.choices[0]?.message?.content || "No response generated.";
      return {
        reply,
        mode: isWebsiteQuery ? 'WEBSITE_LLM' : 'ACADEMIC_AI'
      };
    } catch (err) {
      if (err.status === 429) {
        console.log(`Malphor Groq rate limit on key index ${currentKeyIndex}. Rotating...`);
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        attempts++;
        continue;
      }
      console.error("Malphor Router Groq Error:", err);
      break;
    }
  }

  return {
    reply: "⚠️ Malphor AI service is temporarily unavailable due to API rate limits. Please try again shortly.",
    mode: isWebsiteQuery ? 'WEBSITE_LLM' : 'ACADEMIC_AI'
  };
};

module.exports = {
  processMalphorRequest
};
