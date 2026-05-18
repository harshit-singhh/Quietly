// ─────────────────────────────────────────
// TO SWITCH AI PROVIDERS:
// 1. Edit only this file
// 2. Keep the function signature identical:
//    aiTTS(text, options) → base64 string
// 3. Change the API endpoint, key, and body format
// 4. Zero changes needed in any edge function
// ─────────────────────────────────────────
//
// Google Cloud TTS Neural2 — free tier: 1M characters/month
// Neural2 voices are the most natural-sounding on the free tier.

const GOOGLE_TTS_URL =
  'https://texttospeech.googleapis.com/v1/text:synthesize'

function getTTSKey(): string {
  const key = Deno.env.get('GOOGLE_TTS_API_KEY')
  if (!key) throw new Error('GOOGLE_TTS_API_KEY is not set')
  return key
}

export async function aiTTS(
  text: string,
  options?: {
    voice?: string        // default: en-US-Neural2-F
    speakingRate?: number // default: 0.95 (slightly slower = calming)
    pitch?: number        // default: -1.0 (slightly lower = warmer)
  },
): Promise<string> {
  // Returns base64-encoded MP3 string — client decodes and plays it
  const body = {
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: options?.voice ?? 'en-US-Neural2-F',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: options?.speakingRate ?? 0.95,
      pitch: options?.pitch ?? -1.0,
      effectsProfileId: ['headphone-class-device'],
    },
  }

  const response = await fetch(
    `${GOOGLE_TTS_URL}?key=${getTTSKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `TTS error: ${error.error?.message ?? 'Unknown error'}`,
    )
  }

  const data = await response.json()
  const audioBase64 = data.audioContent

  if (!audioBase64) throw new Error('TTS returned no audio')
  return audioBase64
}
