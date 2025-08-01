const OpenAI = require('openai');

// Initialise OpenAI once; reuse for all requests
let openai = null;
const { GoogleGenerativeAI } = require('@google/generative-ai');
let gemini = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
if (process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  gemini = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
}

/**
 * POST /api/ai/chat
 * Request body: { messages: [{ role: 'user'|'assistant'|'system', content: string }] }
 * Returns: { reply: { role, content } }
 */
exports.aiChat = async (req, res) => {
  if (!openai && !gemini) {
    return res.status(503).json({ error: 'AI service not configured (no provider keys set)' });
  }
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }
  try {
    // Always prepend a friendly system prompt so the bot knows its scope
    const systemPrompt = {
      role: 'system',
      content: 'You are the helpful assistant for the Gig Worker Finder website. Answer questions about using the site, pricing, posting jobs, theme switching, or general currency/exchange-rate queries. Keep replies short and friendly.'
    };
    const payload = [systemPrompt, ...messages.slice(-20)]; // keep last 20 turns max
    let reply;
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: payload,
          temperature: 0.6,
          max_tokens: 500,
        });
        reply = completion.choices[0].message;
      } catch (openErr) {
        console.warn('OpenAI failed, trying Gemini if available', openErr?.message || openErr);
        if (!gemini) throw openErr; // rethrow if no fallback
      }
    }
    if (!reply && gemini) {
      // Gemini fallback or primary
      const historyText = payload.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      const geminiResp = await gemini.generateContent(historyText);
      const text = geminiResp.response.text().trim();
      reply = { role: 'assistant', content: text };
    }
    res.json({ reply });
  } catch (err) {
    console.error('AI chat error', err.message);
    res.status(500).json({ error: 'AI service error' });
  }
};
