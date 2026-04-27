export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, level } = req.body;

  if (!text || !level) {
    return res.status(400).json({ error: 'Missing text or level' });
  }

  const prompt = `Du bist ein strenger Deutschlehrer und Experte für Duden-Regeln auf Niveau ${level}.

Analysiere den folgenden Text nach diesen Duden-Regeln:
1. Groß/Kleinschreibung: Alle Substantive und Substantivierungen groß
2. Kommafehler: vor Nebensätzen (dass, weil, wenn, obwohl, damit, während...)
3. Grammatik: Kasus, Artikel, Adjektivdeklination, Verbkonjugation, Wortstellung
4. Rechtschreibung: ss vs. ß, Zusammen- und Getrenntschreibung

Text: """${text}"""

Antworte NUR mit einem JSON-Objekt ohne Markdown-Backticks:
{
  "corrected": "Vollständig korrigierter Text",
  "errors": [
    {
      "type": "gram|spell|punct|case",
      "original": "der fehlerhafte Ausdruck",
      "correction": "die richtige Form",
      "explanation": "Türkçe açıklama"
    }
  ]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);

    return res.status(200).json(result);

  } catch (e) {
    return res.status(500).json({ error: 'Analiz sırasında hata oluştu.' });
  }
}
