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

  const prompt = `Du bist ein strenger Deutschlehrer auf Niveau ${level}. Analysiere diesen Text nach Duden-Regeln. Text: """${text}""" Antworte NUR mit JSON ohne Backticks: {"corrected":"...","errors":[{"type":"gram|spell|punct|case","original":"...","correction":"...","explanation":"Türkçe açıklama"}]}`;

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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error?.message || 'Anthropic API error', detail: data });
    }

    if (!data.content || !Array.isArray(data.content)) {
      return res.status(500).json({ error: 'Unexpected API response', detail: data });
    }

    const raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);
    return res.status(200).json(result);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
