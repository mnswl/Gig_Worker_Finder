// server/utils/geminiHelper.js
// Centralised Gemini client with automatic model fallback.
// Tries the best models in order until a quota-exhausted error occurs
// and returns the first successful completion text.

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ordered list of Gemini models to try (modify as needed)
const MODEL_PRIORITY = [
  'gemini-1.5-flash', // fast & cheap
];

// Provide multiple keys by comma-separating them in GEMINI_API_KEY
// e.g. GEMINI_API_KEY="key_one,key_two,key_three"
const API_KEYS = (process.env.GEMINI_API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);

/**
 * Generate a response using Gemini with automatic model fallback.
 * @param {string} prompt - Full prompt or chat history text.
 * @param {string[]} [models] - Optional custom model order.
 * @returns {Promise<string>} Assistant reply text.
 */
async function generateGeminiResponse(prompt, models = MODEL_PRIORITY) {
  if (API_KEYS.length === 0) {
    throw new Error('No Gemini API keys configured');
  }

  for (const apiKey of API_KEYS) {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`[Gemini] Using model ${modelName} with key ****${apiKey.slice(-4)}`);
        const resp = await model.generateContent(prompt);
        const text = resp?.response?.text()?.trim();
        if (text) return text;
      } catch (err) {
        const status = err?.status || err?.code || err?.response?.status;
        const quotaError = status === 429 || status === 403;
        const unsupported = status === 404;
        if (quotaError || unsupported) {
          // Move on to next model or key
          continue;
        }
        // Unknown error — surface it up
        throw err;
      }
    }
  }
  throw new Error('All Gemini API keys/models are out of quota.');
}

module.exports = { generateGeminiResponse, MODEL_PRIORITY };
