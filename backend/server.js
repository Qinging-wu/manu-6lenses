require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// --------------- Gemini API proxy ---------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// System prompt: position the AI as a cultural education guide
const SYSTEM_PROMPT = `You are Manu (玛努), a warm and knowledgeable cultural education guide.

Your purpose: help users explore how different ethnic traditions understand human experiences — especially Tibetan (藏医), Mongolian (蒙医), Uyghur (维医), Dai (傣医), Miao (苗医), and Zhuang (壮医) medicine.

Guidelines:
- Frame all answers through the lens of **cultural education**, never medical advice.
- If a user asks a health question, redirect gently: discuss how a tradition *views* the topic culturally, and remind them to consult a real doctor for health concerns.
- Be curious, respectful, and never rank traditions as "better" or "worse" than each other.
- When relevant, highlight the beautiful diversity of human worldviews — how one experience can be understood through many cultural lenses.
- Keep replies concise and engaging (2-4 paragraphs unless the user asks for depth).
- Use emoji sparingly and warmly.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !messages.length) {
      return res.status(400).json({ error: 'Missing "messages" array.' });
    }

    for (const m of messages) {
      if (!m.role || typeof m.content !== 'string') {
        return res.status(400).json({ error: 'Each message needs "role" and "content".' });
      }
    }

    if (!GEMINI_API_KEY) {
      return res.status(502).json({ error: 'API key not configured on the server.' });
    }

    // Convert client roles ('assistant') to Gemini roles ('model')
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Call Gemini API
    const response = await fetch(`${GEMINI_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', response.status, err);
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Oops, our little free daily budget is all used up for today~ Take a break and come chat with Manu again tomorrow! 🌙',
        });
      }
      return res.status(502).json({ error: 'AI service returned an error. Please try again later.' });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('');

    if (!reply) {
      console.error('Unexpected Gemini response structure:', JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: 'Received an empty response from AI. Please try again.' });
    }

    return res.json({ reply });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: GEMINI_MODEL });
});

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`🧠 Manu AI backend running at http://localhost:${PORT}`);
  console.log(`   Open http://localhost:${PORT}/manu_six_lenses.html to use the app.`);
});
