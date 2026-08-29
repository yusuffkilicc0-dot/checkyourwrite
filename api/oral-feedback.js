import { connectDB } from './_lib/db.js';
import { User } from './_lib/models.js';
import { verifyAuth } from './_lib/auth.js';

const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';
const ADMIN_EMAILS = ['yusuffkilicc0@gmail.com'];

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

  // Mundlich Pratik su an sadece admin'e acik.
  const auth = verifyAuth(req);
  if (!auth) return res.status(401).json({ error: 'Giris gerekli.' });
  try {
    await connectDB();
    const user = await User.findById(auth.userId);
    const email = (user?.email || '').toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'Bu ozellik su an gelistirme asamasinda.' });
    }
  } catch (e) {
    console.error('oral-feedback auth hatasi:', e);
    return res.status(500).json({ error: 'Sunucu hatasi.' });
  }

  const { transcript, mode, topic } = req.body || {};

  if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 20) {
    return res.status(400).json({ error: 'Degerlendirilecek konusma cok kisa. Once bir prova yapip konusman gerekiyor.' });
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
      return res.status(500).json({ error: 'Degerlendirme sirasinda hata olustu. Birkac saniye sonra tekrar dene.' });
    }

    let raw = data.content[0].text.trim();
    raw = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Degerlendirme okunamadi, tekrar dene.' });
    }

    return res.status(200).json(result);
  } catch (e) {
    console.error('oral-feedback hatasi:', e);
    return res.status(500).json({ error: 'Sunucu hatasi olustu. Birkac saniye sonra tekrar dene.' });
  }
}
