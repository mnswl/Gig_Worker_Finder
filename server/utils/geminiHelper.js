// server/utils/geminiHelper.js
// Centralised Gemini client with automatic model fallback.
// Tries the best models in order until a quota-exhausted error occurs
// and returns the first successful completion text.

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ordered list of Gemini models to try (modify as needed)
const MODEL_PRIORITY = [
  'gemini-1.5-flash', // fast & cheap
  'gemini-pro',       // robust
  'gemini-1.0-pro',   // legacy fallback
];

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Generate a response using Gemini with automatic model fallback.
 * @param {string} prompt - Full prompt or chat history text.
 * @param {string[]} [models] - Optional custom model order.
 * @returns {Promise<string>} Assistant reply text.
 */
async function generateGeminiResponse(prompt, models = MODEL_PRIORITY) {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const resp = await model.generateContent(prompt);
      const text = resp?.response?.text()?.trim();
      if (text) return text;
    } catch (err) {
      const status = err?.status || err?.code || err?.response?.status;
      const quotaError = status === 429 || status === 403 || /exceed/i.test(err.message);
      if (quotaError) {
        // Try next model in the list
        continue;
      }
      // Unknown error – rethrow
      throw err;
    }
  }
  throw new Error('All Gemini models exhausted their quota.');
}

module.exports = { generateGeminiResponse, MODEL_PRIORITY };
