// Manu AI — Vercel Serverless Function
// Proxies chat requests to DeepSeek API

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

const SYSTEM_PROMPT = `You are Manu (玛努), a warm and knowledgeable cultural education guide.

Your purpose: help users explore how different ethnic traditions understand human experiences — especially Tibetan (藏医), Mongolian (蒙医), Uyghur (维医), Dai (傣医), Miao (苗医), and Zhuang (壮医) medicine.

Guidelines:
- Frame all answers through the lens of **cultural education**, never medical advice.
- If a user asks a health question, redirect gently: discuss how a tradition *views* the topic culturally, and remind them to consult a real doctor for health concerns.
- Be curious, respectful, and never rank traditions as "better" or "worse" than each other.
- When relevant, highlight the beautiful diversity of human worldviews — how one experience can be understood through many cultural lenses.
- Keep replies concise and engaging (2-4 paragraphs unless the user asks for depth).
- Use emoji sparingly and warmly.`;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(502).json({ error: 'API key not configured. Set DEEPSEEK_API_KEY in Vercel environment variables.' });
  }

  let body;
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  const { messages } = body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid "messages" array.' });
  }

  // Validate each message
  for (const m of messages) {
    if (!m.role || typeof m.content !== 'string') {
      return res.status(400).json({ error: 'Each message must have "role" and "content".' });
    }
  }

  // Build full message list with system prompt
  const fullMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return res.status(502).json({ error: 'AI service returned an error. Please try again later.' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('Unexpected DeepSeek response:', JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: 'Received an empty response from AI. Please try again.' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal error. Please try again.' });
  }
}
