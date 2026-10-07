import { connectDB } from './_lib/db.js';
import { User } from './_lib/models.js';
import { verifyAuth } from './_lib/auth.js';
import { consumeOral, refundOral } from './_lib/oralQuota.js';

const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';

const LIMIT_MESSAGES = {
  free: 'Bugünkü 3 ücretsiz AI değerlendirme hakkın doldu. Premium ile günde 10, Pro ile günde 50 değerlendirme alabilirsin.',
  premium: 'Bugünkü 10 AI değerlendirme hakkın doldu. Pro ile günde 50 değerlendirme alabilirsin.',
  pro: 'Bugünkü 50 AI değerlendirme hakkın doldu (adil kullanım sınırı). Hakkın yarın yenilenir.',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const origin = req.headers.origin || '';
  if (origin && origin !== ALLOWED_ORIGIN) return res.status(403).json({ error: 'Erisim reddedildi.' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Sunucu hatasi: API anahtari bulunamadi.' });

  const auth = verifyAuth(req);
  if (!auth) return res.status(401).json({ error: 'AI değerlendirmesi için giriş yapman gerekiyor.' });

  const { transcript, mode, topic } = req.body || {};

  // Geçersiz istek hak düşmeden reddedilir.
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 20) {
    return res.status(400).json({ error: 'Değerlendirilecek konuşma çok kısa. Önce bir prova yapıp konuşman gerekiyor.' });
  }

  // ── Günlük hak (ücretsiz 3 / Premium 10 / Pro 50) ──
  let user, usage;
  try {
    await connectDB();
    user = await User.findById(auth.userId);
    if (!user) return res.status(401).json({ error: 'Oturum geçersiz, lütfen tekrar giriş yap.' });
    const q = await consumeOral(user);
    if (!q.ok) {
      return res.status(429).json({
        error: LIMIT_MESSAGES[q.usage.plan] || LIMIT_MESSAGES.free,
        limitReached: true,
        usage: q.usage,
      });
    }
    usage = q.usage;
  } catch (e) {
    console.error('oral-feedback kota hatasi:', e);
    return res.status(500).json({ error: 'Sunucu hatası, lütfen tekrar dene.' });
  }

  // Değerlendirme başarısız olursa düşülen hak yanıt GÖNDERİLMEDEN iade edilir
  // (Vercel yanıttan sonra fonksiyonu dondurabilir, finally güvenilir değil).
  async function fail(message) {
    try { await refundOral(user); } catch (e) { console.error('oral-feedback iade hatasi:', e); }
    return res.status(500).json({ error: message + ' (Hakkın düşülmedi.)' });
  }

  const t = transcript.trim().slice(0, 8000); // guvenlik siniri
  const modeLabel = mode || 'Sözlü prova';
  const topicLabel = topic || '';

  try {
    const prompt = `You are an experienced telc C1 Hochschule oral examiner (Prüfer) evaluating a spoken practice session.

IMPORTANT CONTEXT: This transcript was produced by BROWSER SPEECH RECOGNITION from the student speaking German aloud. Speech-to-text errors are common (wrong word boundaries, missing capitalization on nouns, misheard words). You MUST first mentally reconstruct what the student most likely actually said, ignoring obvious transcription artifacts. Do NOT penalize the student for speech-recognition errors — only evaluate genuine language mistakes (grammar, word choice, structure) that the student clearly made.

SESSION MODE: ${modeLabel}
${topicLabel ? `TOPIC: ${topicLabel}` : ''}

TRANSCRIPT (raw, from speech recognition):
"""
${t}
"""

Evaluate against the telc C1 Hochschule mündliche Prüfung criteria. Reply ONLY with valid JSON, no markdown fences:

{
  "cleanedNote": "One short Turkish sentence noting if you had to reconstruct heavily due to transcription noise, or empty string if transcript was clear.",
  "overallScore": <integer 0-100, overall C1 oral readiness>,
  "overallLabel": "short German label, e.g. 'Sehr gut', 'Gut', 'Ausbaufähig', 'Noch nicht C1'",
  "summary": "2-3 sentences in Turkish: overall impression, is this C1 level for a spoken exam, main takeaway.",
  "criteria": [
    {
      "name": "Aussprache & Flüssigkeit",
      "score": <1-5>,
      "comment": "Türkçe: telaffuz ve akıcılık hakkında. Not: transkriptten telaffuzu tam ölçemezsin, akıcılık/duraksama/kelime bulma açısından yorumla ve bunu belirt."
    },
    {
      "name": "Wortschatz",
      "score": <1-5>,
      "comment": "Türkçe: kelime çeşitliliği, C1 düzeyi kelimeler, tekrarlar, uygun academic/formal register kullanımı."
    },
    {
      "name": "Grammatik",
      "score": <1-5>,
      "comment": "Türkçe: cümle yapıları, Konjunktiv, Passiv, Nebensätze, hata sıklığı. Örnek hataları öğrencinin kendi cümlesinden ver."
    },
    {
      "name": "Aufbau & Kohärenz",
      "score": <1-5>,
      "comment": "Türkçe: konuşmanın yapısı, mantıksal akış, bağlaçlar (Konnektoren), giriş-gelişme-sonuç."
    },
    {
      "name": "Interaktion & Argumentation",
      "score": <1-5>,
      "comment": "Türkçe: argüman geliştirme, örnekle destekleme, sorulara/tartışmaya uygun tepki (mode buna uygunsa)."
    }
  ],
  "strengths": ["Türkçe, 2-4 madde: öğrencinin gerçekten iyi yaptığı şeyler (kendi cümlelerinden örnekle)"],
  "improvements": [
    {
      "point": "Türkçe: geliştirilmesi gereken nokta",
      "example": "Öğrencinin söylediği (yeniden yapılandırılmış) cümle → C1 düzeyinde nasıl söylenmeliydi (Almanca örnek)"
    }
  ],
  "nextFocus": "Türkçe, 1-2 cümle: bir sonraki provada özellikle neye odaklanmalı."
}

Rules:
- Scores must be honest and calibrated to a real C1 exam, not inflated.
- All "comment", "summary", "strengths", "point", "nextFocus" text in TURKISH.
- Criterion "name" and "overallLabel" in GERMAN. German example sentences stay in German.
- If the mode is "Günlük Isınma" or a partial mode, adapt: some criteria (e.g. Interaktion) may be less applicable — say so briefly rather than scoring harshly.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error('Anthropic hatasi:', data.error);
      return fail('Değerlendirme sırasında hata oluştu. Birkaç saniye sonra tekrar dene.');
    }

    let raw = (data.content && data.content[0] && data.content[0].text || '').trim();
    raw = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return fail('Değerlendirme okunamadı, tekrar dene.');
    }

    return res.status(200).json({ ...result, usage });
  } catch (e) {
    console.error('oral-feedback hatasi:', e);
    return fail('Sunucu hatası oluştu. Birkaç saniye sonra tekrar dene.');
  }
}
