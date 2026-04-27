export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { text, level } = req.body;

  const prompt = `Du bist ein strenger Deutschlehrer auf Niveau ${level}. Analysiere diesen Text nach Duden-Regeln. Text: """${text}""" Antworte NUR mit JSON ohne Backticks: {"corrected":"...","errors":[{"type":"gram|spell|punct|case","original":"...","correction":"...","explanation":"Türkçe açıklama"}]}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  const raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
  const result = JSON.parse(raw);
  return res.status(200).json(result);
}
