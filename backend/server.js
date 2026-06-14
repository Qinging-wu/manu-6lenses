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

// --------------- DeepSeek API proxy ---------------
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

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

// Conversation history store (in-memory, per session — resets on server restart)
// Keyed by a simple sessionId passed from the client
const sessions = new Map();
const MAX_HISTORY = 20; // keep last 20 messages per session

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "message" field.' });
    }

    // Get or create session history
    const sid = sessionId || 'default';
    if (!sessions.has(sid)) {
      sessions.set(sid, [{ role: 'system', content: SYSTEM_PROMPT }]);
    }
    const history = sessions.get(sid);

    // Add user message
    history.push({ role: 'user', content: message });

    // Trim history if too long (keep system prompt + recent messages)
    if (history.length > MAX_HISTORY + 1) {
      const systemMsg = history[0];
      const recent = history.slice(-MAX_HISTORY);
      sessions.set(sid, [systemMsg, ...recent]);
    }

    // Call DeepSeek API
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: history,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('DeepSeek API error:', response.status, err);
      return res.status(502).json({ error: 'AI service returned an error. Please try again later.' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('Unexpected DeepSeek response structure:', JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: 'Received an empty response from AI. Please try again.' });
    }

    // Add assistant reply to history
    history.push({ role: 'assistant', content: reply });

    // Keep history bounded
    if (history.length > MAX_HISTORY + 1) {
      const systemMsg = history[0];
      const recent = history.slice(-MAX_HISTORY);
      sessions.set(sid, [systemMsg, ...recent]);
    }

    return res.json({ reply });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: DEEPSEEK_MODEL });
});

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`🧠 Manu AI backend running at http://localhost:${PORT}`);
  console.log(`   Open http://localhost:${PORT}/manu_six_lenses.html to use the app.`);
});
