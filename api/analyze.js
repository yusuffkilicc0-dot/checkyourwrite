export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Sunucu hatası: API anahtarı bulunamadı.' });

  const { text, level } = req.body;

  // 1. Boş metin
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Metin boş. Lütfen analiz etmek istediğiniz Almanca metni girin.' });
  }

  const t = text.trim();

  // 2. Çok kısa metin
  if (t.length < 10) {
    return res.status(400).json({ error: 'Metin çok kısa. Lütfen en az 10 karakter uzunluğunda bir metin girin.' });
  }

  // 3. Çok uzun metin
  if (t.length > 3000) {
    return res.status(400).json({ error: 'Metin çok uzun. Lütfen 3000 karakterden kısa bir metin girin.' });
  }

  // 4. Emoji
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F2FF}\u{1F004}\u{1F0CF}]/u;
  if (emojiRegex.test(t)) {
    return res.status(400).json({ error: 'Metinde emoji tespit edildi. Emoji kullanmadan yalnızca Almanca metin girin.' });
  }

  // 5. Link / URL
  const urlRegex = /(https?:\/\/|www\.)\S+/i;
  if (urlRegex.test(t)) {
    return res.status(400).json({ error: 'Metinde bir link tespit edildi. Lütfen yalnızca Almanca metin girin, link eklemeyin.' });
  }

  // 6. Sadece sayı veya sembol
  const onlyNumbersSymbols = /^[\d\s\W]+$/.test(t);
  if (onlyNumbersSymbols) {
    return res.status(400).json({ error: 'Metin yalnızca sayı veya sembol içeriyor. Lütfen Almanca cümleler girin.' });
  }

  // 7. Sadece noktalama işaretleri
  const onlyPunctuation = /^[\s.,!?;:'"(){}\[\]\-_*&%$#@^~`|\\/<>=+]+$/.test(t);
  if (onlyPunctuation) {
    return res.status(400).json({ error: 'Metin yalnızca noktalama işaretleri içeriyor. Lütfen Almanca cümleler girin.' });
  }

  // 8. Kod (HTML, JS, CSS vb.)
  const codeRegex = /<[a-z][\s\S]*?>|function\s*\(|const\s+\w+\s*=|var\s+\w+\s*=|let\s+\w+\s*=|=>|<\/[a-z]+>/i;
  if (codeRegex.test(t)) {
    return res.status(400).json({ error: 'Metinde programlama kodu tespit edildi. Bu araç yalnızca Almanca metin analizi yapar.' });
  }

  // API CALL
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

    if (data.error) {
      return res.status(500).json({ error: 'Sunucu hatası oluştu. Lütfen birkaç saniye bekleyip tekrar deneyin.' });
    }

    let raw = data.content[0].text.trim();
    raw = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();

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
