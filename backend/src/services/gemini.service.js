const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake_key');

const generateResponse = async (message, mode = 'STUDENT') => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
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

    const prompt = systemPrompt + "User query: " + message;
    
    // For demo purposes if key is invalid, just mock it instead of crashing.
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_google_gemini_api_key') {
      return `[Mock AI Response for ${mode}]: I received your query about "${message}". Please configure your real Gemini API key in the backend .env to get actual AI responses!`;
    }

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      if (err.status === 503) {
        console.log("Gemini 2.5 flash is overloaded, falling back to gemini-2.5-pro...");
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const fallbackResult = await fallbackModel.generateContent(prompt);
        return fallbackResult.response.text();
      }
      throw err;
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error('Failed to fetch response from AI');
  }
};

module.exports = {
  generateResponse
};
