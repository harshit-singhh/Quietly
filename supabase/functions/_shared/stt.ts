// ─────────────────────────────────────────
// TO SWITCH AI PROVIDERS:
// 1. Edit only this file
// 2. Keep the function signature identical:
//    aiTranscribe(audioBase64, mimeType) → string
// 3. Change the API endpoint, key, and body format
// 4. Zero changes needed in any edge function
// ─────────────────────────────────────────

const GEMINI_STT_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  'gemini-2.0-flash:generateContent'

function getGeminiKey(): string {
  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) throw new Error('GEMINI_API_KEY is not set')
  return key
}

export async function aiTranscribe(
  audioBase64: string,
  mimeType = 'audio/m4a',
): Promise<string> {
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: audioBase64,
            },
          },
          {
            text:
              'Transcribe this audio exactly as spoken. ' +
              'Return only the transcript text, nothing else. ' +
              'If no speech is detected, return exactly: ' +
              'NO_SPEECH_DETECTED',
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.0,
    },
  }

  const response = await fetch(
    `${GEMINI_STT_URL}?key=${getGeminiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Transcription error: ${error.error?.message ?? 'Unknown error'}`,
    )
  }

  const data = await response.json()
  const transcript =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

  if (!transcript || transcript === 'NO_SPEECH_DETECTED') {
    throw new Error('NO_SPEECH_DETECTED')
  }

  return transcript
}
