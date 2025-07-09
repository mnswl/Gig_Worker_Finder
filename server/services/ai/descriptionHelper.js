// AI helper for improving job descriptions and suggesting missing fields
// Uses OpenAI Chat Completion API. Requires OPENAI_API_KEY in environment variables.
// If the key is missing or there is an API error, functions return null so controllers can fallback gracefully.

const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini (primary)
let gemini = null;
if (process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
    apiEndpoint: process.env.GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta',
  });
  gemini = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'models/gemini-pro' });
}

// Groq (secondary – OpenAI-compatible endpoint)
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

// Optional OpenAI fallback (tertiary)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Improve the text of a job description and suggest missing fields.
 * @param {Object} job - { title: string, description: string, location?: string, schedule?: string, type?: string }
 * @returns {Promise<{improvedDescription: string, missingFields: string[]}>|null}
 */
function buildPrompt(job) {
  // Ask for minified JSON to ease parsing. Escape internal newlines.
  // We'll later unescape if needed.

  return `You are an expert copywriter and job-posting assistant.
Respond ONLY with minified JSON on a single line. Escape any newline characters inside strings as \\n. Do NOT wrap in code blocks.

\n\nRewrite the following job description so it is clear, concise, and professional (keep markdown line breaks).\nThen list any IMPORTANT fields that appear to be missing such as required skills, schedule, location, employment type, or pay range.\n\nRespond ONLY as valid JSON with this shape:\n{\n  \"improvedDescription\": string,\n  \"missingFields\": string[]\n}\n\n---\nTITLE: ${job.title}\nDESCRIPTION:\n${job.description}\n`;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Attempt to salvage by extracting first {...}
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try {
        return JSON.parse(text.slice(first, last + 1));
      } catch {}
    }
    return null;
  }
}

async function improveDescription(job) {
  const prompt = buildPrompt(job);

  // 1. Gemini (Google Generative AI)
  if (gemini) {
    try {
      const result = await gemini.generateContent(prompt);
      const text = result.response.text().trim();
      const parsed = tryParseJson(text);
      if (parsed) return parsed;
      console.warn('Gemini response not JSON');
    } catch (err) {
      console.warn('Gemini failed:', err.message);
    }
  }

  // 2. Groq fallback
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 350,
      });
      const content = completion.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (err) {
      console.warn('Groq failed:', err.message);
    }
  }

  // 3. OpenAI (if still configured and quota allows)
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 350,
      });
      const content = completion.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (err) {
      console.warn('OpenAI failed:', err.message);
    }
  }

  // 4. Hugging Face fallback
  if (process.env.HF_TOKEN) {
    try {
      return await hfImproveDescription(job);
    } catch (err) {
      console.error('HF inference failed', err.message);
    }
  }

  return null;
}
/* Legacy duplicate block below is commented out to avoid syntax errors
// (duplicate code removed)
  if (openai) {
    try {
      const prompt = `You are an expert copywriter and job-posting assistant.\n\nRewrite the following job description so it is clear, concise, and professional (keep markdown line breaks).\nThen list any IMPORTANT fields that appear to be missing such as required skills, schedule, location, employment type, or pay range.\n\nRespond ONLY as valid JSON with this shape:\n{\n  \"improvedDescription\": string,\n  \"missingFields\": string[]\n}\n\n---\nTITLE: ${job.title}\nDESCRIPTION:\n${job.description}\n`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 350
      });
      const content = completion.choices[0].message.content.trim();
      try {
        return JSON.parse(content);
      } catch (err) {
        console.warn('OpenAI response not JSON');
      }
    } catch (err) {
      // Log but continue to HF fallback if quota error etc.
      console.warn('OpenAI API failed, falling back to HF:', err.message);
    }
  }
  // Fallback to Hugging Face
  if (process.env.HF_TOKEN) {
    try {
      return await hfImproveDescription(job);
    } catch (err) {
      console.error('HF inference failed', err.message);
    }
  }
  return null;
  const prompt = `You are an expert copywriter and job-posting assistant.\n\nRewrite the following job description so it is clear, concise, and professional (keep markdown line breaks).\nThen list any IMPORTANT fields that appear to be missing such as required skills, schedule, location, employment type, or pay range.\n\nRespond ONLY as valid JSON with this shape:\n{\n  \"improvedDescription\": string,\n  \"missingFields\": string[]\n}\n\n---\nTITLE: ${job.title}\nDESCRIPTION:\n${job.description}\n`; // end prompt
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 350
    });
    const content = completion.choices[0].message.content.trim();
    // Attempt to parse JSON – if it fails, return null so caller can ignore
    try {
      return JSON.parse(content);
    } catch (err) {
      console.warn('AI response was not JSON. Raw content:', content);
      return null;
    }
  } catch (err) {
    console.error('OpenAI API error', err.message);
    return null;
  }
}

*/
// Lightweight public model; change via HF_MODEL env if desired
const HF_MODEL = process.env.HF_MODEL || 'google/flan-t5-large';

async function hfImproveDescription(job) {
  const resp = await fetch(
    `https://api-inference.huggingface.co/models/${HF_MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs:
`Rewrite the job ad clearly and list missing fields.\n\nTITLE:${job.title}\nDESC:${job.description}`
      })
    }
  );
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`HF API ${resp.status}: ${txt.slice(0,100)}`);
  }
  const data = await resp.json();
  const text = Array.isArray(data) && data[0]?.generated_text ? data[0].generated_text : null;
  if (!text) throw new Error('Unexpected HF response format');
  return { improvedDescription: text.trim(), missingFields: [] };
}

module.exports = {
  improveDescription,
};
