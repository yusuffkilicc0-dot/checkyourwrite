export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { text, level } = req.body;
  if (!text || !level) {
    return res.status(400).json({ error: 'Missing text or level' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are a German language teacher. Analyze this ${level} level German text for errors.

Text: ${text}

Reply ONLY with valid JSON, no markdown, no backticks:
{"corrected":"corrected text here","errors":[{"type":"gram","original":"wrong","correction":"right","explanation":"Turkish expl
