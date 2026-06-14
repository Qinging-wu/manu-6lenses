// Manu AI — Cloudflare Worker
// Serves the Six Lenses page and proxies chat requests to DeepSeek

import html from './manu_six_lenses.html' with { type: 'text' };

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-v4-flash';

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
  const apiKey = env.DEEPSEEK_API_KEY;
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

  // Prepend system prompt + inject the messages
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
        thinking: { type: 'disabled' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return jsonResponse(502, { error: 'AI service returned an error. Please try again later.' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('Unexpected DeepSeek response:', JSON.stringify(data).slice(0, 500));
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
      'Access-Control-Allow-Origin': '*',
    },
  });
}
