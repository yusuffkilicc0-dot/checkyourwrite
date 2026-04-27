const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';

const rateLimit = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { minuteCount: 1, minuteStart: now, dayCount: 1, dayStart: now });
    return false;
  }

  const d = rateLimit.get(ip);

  if (now - d.minuteStart > oneMinute) { d.minuteCount = 0; d.minuteStart = now; }
  if (now - d.dayStart > oneDay) { d.dayCount = 0; d.dayStart = now; }

  if (d.dayCount >= 15) {
    const h = Math.ceil((d.dayStart + oneDay - now) / (60 * 60 * 1000));
    return { error: 'Gunluk kullanim limitine ulastiniz (15/15). ' + h + ' saat sonra tekrar kullanabilirsiniz.' };
  }

  if (d.minuteCount >= 2) {
    return { error: 'Cok hizli istek gonderdiniz. Lutfen 1 dakika bekleyip tekrar deneyin.' };
  }

  d.minuteCount++;
  d.dayCount++;
  return false;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const origin = req.headers.origin || '';
  if (origin && origin !== ALLOWED_ORIGIN) return res.status(403).json({ error: 'Erisim reddedildi.' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Sunucu hatasi: API anahtari bulunamadi.' });

  const { text, level } = req.body;

  if (!text || text.trim().length === 0) return res.status(400).json({ error: 'Metin bos. Lutfen analiz etmek istediginiz Almanca metni girin.' });

  const t = text.trim();

  if (t.length < 10) return res.status(400).json({ error: 'Metin cok kisa. Lutfen en az 10 karakter uzunlugunda bir metin girin.' });
  if (t.length > 3000) return res.status(400).json({ error: 'Metin cok uzun. Lutfen 3000 karakterden kisa bir metin girin.' });

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(t)) return res.status(400).json({ error: 'Metinde emoji tespit edildi. Emoji kullanmadan yalnizca Almanca metin girin.' });

  const urlRegex = /(https?:\/\/|www\.)\S+/i;
  if (urlRegex.test(t)) return res.status(400).json({ error: 'Metinde bir link tespit edildi. Lutfen yalnizca Almanca metin girin.' });

  if (/^[\d\s\W]+$/.test(t)) return res.status(400).json({ error: 'Metin yalnizca sayi veya sembol iceriyor. Lutfen Almanca cumleler girin.' });

  const codeRegex = /<[a-z][\s\S]*?>|function\s*\(|const\s+\w+\s*=|var\s+\w+\s*=|let\s+\w+\s*=/i;
  if (codeRegex.test(t)) return res.status(400).json({ error: 'Metinde programlama kodu tespit edildi. Bu arac yalnizca Almanca metin analizi yapar.' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const limited = isRateLimited(ip);
  if (limited) return res.status(429).json({ error: limited.error });

  try {
    const prompt = `You are a German language teacher evaluating a ${level} level text.

Analyze the text for errors. All explanations MUST be in Turkish only.

TEXT:
${t}

Reply ONLY with valid JSON, no markdown:
{
  "corrected": "corrected text here",
  "score": <integer 0-100>,
  "scoreLabel": "short Turkish label for the score (e.g. 'Çok İyi', 'Geliştirilmeli', 'Mükemmel')",
  "scoreFeedback": "1-2 sentence Turkish feedback explaining the score and how to improve",
  "errors": [
    {"type": "gram", "original": "wrong text", "correction": "correct text", "explanation": "Türkçe açıklama"}
  ]
}

Score guide (consider error count, error severity, and text length together):
- 90-100: Near perfect, 0-1 minor errors
- 75-89: Good, a few small errors
- 55-74: Average, several errors that affect clarity
- 35-54: Weak, many errors
- 0-34: Needs significant work

Type values: gram=grammar, spell=spelling, punct=punctuation, case=capitalization. Use exactly these values.`;

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
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: 'Sunucu hatasi olustu. Lutfen birkac saniye bekleyip tekrar deneyin.' });

    let raw = data.content[0].text.trim();
    raw = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();

    let result;
    try { result = JSON.parse(raw); }
    catch { result = { corrected: t, score: null, scoreLabel: null, scoreFeedback: null, errors: [] }; }

    return res.status(200).json(result);

  } catch (e) {
    return res.status(500).json({ error: 'Sunucu hatasi olustu. Lutfen birkac saniye bekleyip tekrar deneyin.' });
  }
}
