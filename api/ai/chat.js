// Vercel Serverless Function: /api/ai/chat
// Proxies chat requests to GitHub Models or Mistral using server-side env vars.
// Request: POST { provider: 'github'|'mistral', model: string, messages: [{role, content}], ... }
// Response: { content: string, raw: any }

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const {
      provider,
      model,
      messages,
      temperature,
      max_tokens,
      top_p
    } = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};

    if (!provider || !model || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid body. Expected { provider, model, messages[] }' });
    }

    const isMistral = provider === 'mistral';
    const isGithub = provider === 'github';

    if (!isMistral && !isGithub) {
      return res.status(400).json({ error: "provider must be 'github' or 'mistral'" });
    }

    let upstreamUrl = '';
    let headers = { 'Content-Type': 'application/json' };
    let body = {};

    if (isMistral) {
      const key = process.env.MISTRAL_API_KEY;
      if (!key) return res.status(500).json({ error: 'MISTRAL_API_KEY not configured' });

      upstreamUrl = 'https://api.mistral.ai/v1/chat/completions';
      headers.Authorization = `Bearer ${key}`;
      body = {
        model,
        messages,
        temperature: typeof temperature === 'number' ? temperature : 0.3,
        max_tokens: typeof max_tokens === 'number' ? max_tokens : 512,
        top_p: typeof top_p === 'number' ? top_p : 0.9,
      };
    } else if (isGithub) {
      const key = process.env.GITHUB_MODELS_TOKEN;
      if (!key) return res.status(500).json({ error: 'GITHUB_MODELS_TOKEN not configured' });

      upstreamUrl = 'https://models.github.ai/inference/v1/chat/completions';
      headers.Authorization = `Bearer ${key}`;
      headers['X-GitHub-Api-Version'] = '2024-10-01';
      headers['User-Agent'] = 'coronary-academic-app';
      body = {
        model,
        messages,
        temperature: typeof temperature === 'number' ? temperature : 0.3,
        max_tokens: typeof max_tokens === 'number' ? max_tokens : 512,
        top_p: typeof top_p === 'number' ? top_p : 0.9,
      };
    }

    const upstreamResp = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const text = await upstreamResp.text();
    if (!upstreamResp.ok) {
      return res.status(upstreamResp.status).json({ error: text || 'Upstream error' });
    }

    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    // Normalize common content field
    let content = '';
    if (data && data.choices && data.choices[0]) {
      content = data.choices[0]?.message?.content || data.choices[0]?.delta?.content || '';
    } else if (typeof data === 'object' && data.content) {
      content = data.content;
    } else if (typeof data === 'string') {
      content = data;
    }

    return res.status(200).json({ content, raw: data });
  } catch (err) {
    console.error('[api/ai/chat] error', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
