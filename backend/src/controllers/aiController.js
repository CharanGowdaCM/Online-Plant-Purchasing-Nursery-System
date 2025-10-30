/*
* Chatbot Controller - recives requests from frontend and interacts with Google Generative AI API
* Author: M Lakshya
*/
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = process.env.AI_MODEL || 'gemini-1.5-flash';

function mapHistory(messages = []) {
  const mapped = (messages || [])
    .filter(m => m && typeof m.text === 'string' && m.text.trim())
    .map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

  const firstUserIdx = mapped.findIndex(m => m.role === 'user');
  if (firstUserIdx === -1) return [];
  if (firstUserIdx > 0) return mapped.slice(firstUserIdx);
  return mapped;
}

exports.askPlantAssistant = async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'Missing GOOGLE_API_KEY in server environment' });
    }

    const { systemInstruction, history = [], query } = req.body || {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemInstruction && String(systemInstruction)
    });

    const chat = model.startChat({
      history: mapHistory(history)
    });

    const result = await chat.sendMessage(String(query));
    const answer = result?.response?.text?.() || 'Sorry, I could not generate a response.';

    return res.json({ success: true, answer, model: MODEL_NAME });
  } catch (err) {
    console.error('AI proxy error:', err);
    const message = err?.message || 'AI service error';
    return res.status(500).json({ success: false, error: message });
  }
};
