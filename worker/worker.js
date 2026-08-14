// Manu AI — Cloudflare Worker
// Serves the Six Lenses page and proxies chat requests to Google Gemini (free tier)

import html from './manu_six_lenses.html' with { type: 'text' };

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-3.6-flash';
const ALLOWED_ORIGIN = 'https://manu6lenses.win';

const SYSTEM_PROMPT = `You are Manu (玛努), a warm and knowledgeable cultural education guide.

Your purpose: help users explore how different ethnic traditions understand human experiences — especially Tibetan (藏医), Mongolian (蒙医), Uyghur (维医), Dai (傣医), Miao (苗医), and Zhuang (壮医) medicine.

Guidelines:
- Frame all answers through the lens of **cultural education**, never medical advice.
- If a user asks a health question, redirect gently: discuss how a tradition *views* the topic culturally, and remind them to consult a real doctor for health concerns.
- Be curious, respectful, and never rank traditions as "better" or "worse" than each other.
- When relevant, highlight the beautiful diversity of human worldviews — how one experience can be understood through many cultural lenses.
- Keep replies concise and engaging (2-4 paragraphs unless the user asks for depth).
- Use emoji sparingly and warmly.`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Only allow requests that originate from our own domain
    const origin = request.headers.get('Origin');
    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- Serve the HTML page ---
    if (request.method === 'GET' && (path === '/' || path === '/manu_six_lenses.html')) {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // --- Chat API ---
    if (request.method === 'POST' && path === '/api/chat') {
      return handleChat(request, env);
    }

    // --- Health check ---
    if (request.method === 'GET' && path === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', model: MODEL }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- 404 ---
    return new Response('Not Found', { status: 404 });
  },
};

async function handleChat(request, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse(502, { error: 'API key not configured on the server.' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' });
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return jsonResponse(400, { error: 'Missing or invalid "messages" array.' });
  }

  // Validate message format
  for (const m of messages) {
    if (!m.role || !m.content || typeof m.content !== 'string') {
      return jsonResponse(400, { error: 'Each message must have "role" and "content" (string).' });
    }
  }

  // Convert client roles ('assistant') to Gemini roles ('model')
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const response = await fetch(`${GEMINI_URL}/${MODEL}:generateContent?key=${apiKey}`, {
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
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      if (response.status === 429) {
        return jsonResponse(429, {
          error: "Oops, our little free daily budget is all used up for today~ Take a break and come chat with Manu again tomorrow! 🌙",
        });
      }
      return jsonResponse(502, { error: 'AI service returned an error. Please try again later.' });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('');

    if (!reply) {
      console.error('Unexpected Gemini response:', JSON.stringify(data).slice(0, 500));
      return jsonResponse(502, { error: 'Received an empty response from AI. Please try again.' });
    }

    return jsonResponse(200, { reply });
  } catch (err) {
    console.error('Worker error:', err);
    return jsonResponse(500, { error: 'Internal error. Please try again.' });
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    },
  });
}
