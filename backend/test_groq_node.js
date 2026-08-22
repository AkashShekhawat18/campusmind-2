require('dotenv').config({ path: 'd:/Malphor2.0/ai-service/.env' });
const Groq = require('groq-sdk');

async function test() {
  try {
    const keys = process.env.GROQ_API_KEYS;
    const apiKey = keys ? keys.split(',')[0].trim() : null;
    
    console.log("Using API Key:", apiKey ? "Found" : "Missing");
    
    const groq = new Groq({ apiKey });
    console.log("Creating completion stream...");
    
    const stream = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'how are you and which model you are' }],
      model: 'openai/gpt-oss-20b', // Let's also test 'llama-3.3-70b-versatile' if this fails
      temperature: 0.7,
      max_tokens: 2048,
      stream: true
    });

    let tokens = 0;
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        process.stdout.write(content);
        tokens++;
      }
    }
    console.log("\n\nTokens:", tokens);
  } catch (err) {
    console.error("Error:", err.message || err);
  }
}

test();
