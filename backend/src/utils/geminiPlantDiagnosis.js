require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = process.env.AI_MODEL || 'gemini-1.5-flash';

const extractJson = (text) => {
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  const fencedMatch = String(text).match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fencedMatch ? fencedMatch[1] : String(text);
  const startIndex = raw.indexOf('{');
  const endIndex = raw.lastIndexOf('}');

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('Gemini response is not valid JSON');
  }

  return JSON.parse(raw.slice(startIndex, endIndex + 1));
};

const analyzePlantImage = async ({ imageBase64, mimeType = 'image/jpeg', plantName = 'Plant', location = '' }) => {
  const apiKey = process.env.GOOGLE_PLANT_KEY;

  if (!apiKey) {
    throw new Error('Missing Gemini API key');
  }

  if (!imageBase64) {
    throw new Error('Plant image is required');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  });

  const prompt = [
    'Analyze the plant image and return JSON in the exact structure below.',
    'Do not wrap the answer in markdown or prose.',
    'Return only valid JSON with these keys:',
    '{',
    '  "disease": "",',
    '  "confidence": 0-100,',
    '  "severity": "low|medium|high",',
    '  "treatment": "",',
    '  "prevention": "",',
    '  "care_actions": ["reduce_watering", "increase_sunlight"]',
    '}',
    `Plant context: ${plantName}.`,
    location ? `Location context: ${location}.` : 'Location context: unavailable.'
  ].join('\n');

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBase64,
        mimeType
      }
    }
  ]);

  const responseText = result?.response?.text?.() || '';
  const parsed = extractJson(responseText);

  const confidence = Number.isFinite(Number(parsed.confidence))
    ? Math.max(0, Math.min(100, Number(parsed.confidence)))
    : 0;

  const severity = ['low', 'medium', 'high'].includes(String(parsed.severity || '').toLowerCase())
    ? String(parsed.severity).toLowerCase()
    : 'medium';

  const disease = String(parsed.disease || '').trim();
  const treatment = String(parsed.treatment || '').trim();
  const prevention = String(parsed.prevention || '').trim();
  const careActions = Array.isArray(parsed.care_actions) ? parsed.care_actions : [];

  if (!disease) {
    throw new Error('Gemini response is missing disease');
  }

  return {
    disease,
    confidence,
    severity,
    treatment,
    prevention,
    care_actions: careActions,
    raw_response: parsed,
    model: MODEL_NAME,
    response_text: responseText
  };
};

module.exports = {
  analyzePlantImage
};