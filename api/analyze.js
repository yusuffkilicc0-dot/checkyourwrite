const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';

const rateLimit = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;
  const maxPerMinute = 2;
  const maxPerDay = 15;

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { minuteCount: 1, minuteStart: now, dayCount: 1, dayStart: now });
    return false;
  }

  const d = rateLimit.get(ip);

  if (now - d.minuteStart > oneMinute) {
    d.minuteCount = 0;
    d.minuteStart = now;
  }

  if (now - d.dayStart > oneDay) {
    d.dayCount = 0;
    d.dayStart = now;
  }

  if (d.dayCount >= maxPerDay) {
    const resetIn = Math.ceil((d.dayStart + oneDay - now) / (60 * 60 * 1000));
    return { error: 'Günlük kullanım limitine ulaştınız (15/15). ' + resetIn + ' saat sonra tekrar kullanabilirsiniz.' };
  }

  if (d.minuteCount >= maxPerMinute) {
    return { error: 'Çok hızlı istek gönderdiniz. Lütfen 1 dakika bekleyip tekrar deneyin.' };
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
  if (origin && origin !== ALLOWED_ORIGIN) return res.status(403).json({ error: 'Erişim reddedildi.' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Sunucu hatası: API anahtarı bulunamadı.' });

  const { text, level } = req.body;

  if (!text || text.trim().length === 0) return res.status(400).json({ error: 'Metin boş. Lütfen analiz etmek istediğiniz Almanca metni girin.' });

  const t = text.trim();

  if (t.length < 10) return res.status(400).json({ error: 'Metin çok kısa. Lütfen en az 10 karakter uzunluğunda bir metin girin.' });
  if (t.length > 3000) return res.status(400).json({ error: 'Metin çok uzun. Lütfen 3000 karakterden kısa bir metin girin.' });

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(t)) return res.status(400).json({ error: 'Metinde emoji tespit edildi. Emoji kullanmadan yalnızca Almanca metin girin.' });

  const urlRegex = /(https?:\/\/|www\.)\S+/i;
  if (urlRegex.test(t)) return res.status(400).json({ error: 'Metinde bir link tespit edildi. Lütfen yalnızca Almanca metin girin, link eklemeyin.' });

  if (/^[\d\s\W]+$/.test(t)) return res.status(400).json({ error: 'Metin yalnızca sayı veya sembol içeriyor. Lütfen Almanca cümleler girin.' });
  if (/^[\s.,!?;:'"(){}\[\]\-_*&%$#@^~`|\\/<>=+]+$/.test(t)) return res.status(400).json({ error: 'Metin yalnızca noktalama işaretleri içeriyor. Lütfen Almanca cümleler girin.' });

  const codeRegex = /<[a-z][\s\S]*?>|function\s*\(|const\s+\w+\s*=|var\s+\w+\s*=|let\s+\w+\s*=|=>|<\/[a-z]+>/i;
  if (codeRegex.test(t)) return res.status(400).json({ error: 'Metinde programlama kodu tespit edildi. Bu araç yalnızca Almanca metin analizi yapar.' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  const limited = isRateLimited(ip);
  if (limited) return res.status(429).json({ error: limited.error });

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
          content: `You are a German language teacher checking ${level} level text. Analyze for grammar, spelling, punctuation, and capitalization errors.

TEXT:
${t}

Reply ONLY with a JSON object, no markdown, no backticks:
{"corrected":"full corrected text","errors":[{"type":"gram","original":"wrong","correction":"right","explanation":"Turkish explanation"}]}`
        }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: 'Sunucu hatası oluştu. Lütfen birkaç saniye bekleyip tekrar deneyin.' });

    let raw = data.content[0].text.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      result = { corrected: t, errors: [] };
    }

    return res.status(200).json(result);

  } catch (e) {
    return res.status(500).json({ error: 'Sunucu hatası oluştu. Lütfen birkaç saniye bekleyip tekrar deneyin.' });
  }
}

