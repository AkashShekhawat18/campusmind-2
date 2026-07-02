const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generates an embedding for a given text using Google's text-embedding model.
 * Falls back to a simple hash-based embedding if no API key is set.
 * Returns an array of floats.
 */
const generateEmbedding = async (text) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Check if we have a valid (non-placeholder) Gemini API key
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    // Fallback: generate a deterministic hash-based embedding
    // This still allows cosine similarity to work meaningfully for identical/similar strings
    return generateHashEmbedding(text);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Gemini embedding error, using hash fallback:", error.message);
    return generateHashEmbedding(text);
  }
};

/**
 * Generate a deterministic pseudo-embedding from text using character n-gram hashing.
 * This is NOT as good as a real embedding model, but it allows basic similarity 
 * detection between very similar question strings without any API key.
 */
const generateHashEmbedding = (text) => {
  const dim = 256;
  const vec = new Float32Array(dim).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const words = normalized.split(/\s+/);
  
  // Use character trigrams and word-level features
  for (let i = 0; i < normalized.length - 2; i++) {
    const trigram = normalized.substring(i, i + 3);
    let hash = 0;
    for (let j = 0; j < trigram.length; j++) {
      hash = ((hash << 5) - hash) + trigram.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1;
  }
  
  // Add word-level features
  for (const word of words) {
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 2;
  }
  
  // L2 normalize
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) vec[i] /= norm;
  }
  
  return Array.from(vec);
};

/**
 * Computes Cosine Similarity between two embedding vectors.
 * Returns a score between 0 and 100.
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Convert to 0-100 percentage
  return Math.max(0, Math.min(100, Math.round(similarity * 100)));
};

module.exports = {
  generateEmbedding,
  cosineSimilarity
};
