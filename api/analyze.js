export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { text, level } = req.body;
  if (!text || !level) return res.status(400).json({ error: 'Missing text or level' });

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
          content: `You are a German language teacher checking ${level} level text.

Analyze this text for German language errors (grammar, spelling, punctuation, capitalization).

TEXT TO ANALYZE:
${text}

Respond with ONLY a JSON object. Use double quotes. Escape any special characters in string values.

Format:
{"corrected":"full corrected text","errors":[{"type":"gram","original":"wrong phrase","correction":"correct phrase","explanation":"Turkish explanation of the error and rule"}]}`
        }]
      })
    });

    const data = await response.json();

    if (data.error) return res.status(500).json({ error: data.error.message });

    let raw = data.content[0].text.trim();
    raw = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
    
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      const correctedMatch = raw.match(/"corrected"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      result = {
        corrected: correctedMatch ? correctedMatch[1] : text,
        errors: []
      };
    }

    return res.status(200).json(result);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
