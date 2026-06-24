const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake_key');

const generateResponse = async (message, mode = 'STUDENT') => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let systemPrompt = "";
    if (mode === 'STUDENT') {
      systemPrompt = "You are CampusGPT Student Mode. You help students with DBMS, OS, Computer Networks, Java, Python, AI/ML, DSA, and other academic subjects. Be concise and educational.\n";
    } else {
      systemPrompt = "You are CampusGPT Teacher Mode. You help educators with Question Paper Generation, Repetition Detection, Syllabus Analysis, Bloom Taxonomy, CO/PO Mapping, and Academic Planning.\n";
    }

    const prompt = systemPrompt + "User query: " + message;
    
    // For demo purposes if key is invalid, just mock it instead of crashing.
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_google_gemini_api_key') {
      return `[Mock AI Response for ${mode}]: I received your query about "${message}". Please configure your real Gemini API key in the backend .env to get actual AI responses!`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I am having trouble connecting to my AI brain right now.";
  }
};

module.exports = {
  generateResponse
};
