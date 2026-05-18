// ─────────────────────────────────────────
// TO SWITCH AI PROVIDERS:
// 1. Edit only this file
// 2. Keep the function signature identical:
//    aiChat(messages, systemPrompt, options) → string
// 3. Change the API endpoint, key, and body format
// 4. Zero changes needed in any edge function
// ─────────────────────────────────────────

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  'gemini-2.0-flash:generateContent'

function getGeminiKey(): string {
  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) throw new Error('GEMINI_API_KEY is not set')
  return key
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function aiChat(
  messages: AIMessage[],
  systemPrompt: string,
  options?: {
    maxTokens?: number
    temperature?: number
  },
): Promise<string> {
  // Gemini uses 'model' for the assistant role and takes the
  // system prompt as a separate field, not as a message.
  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      maxOutputTokens: options?.maxTokens ?? 500,
      temperature: options?.temperature ?? 0.75,
    },
  }

  const response = await fetch(
    `${GEMINI_API_URL}?key=${getGeminiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `AI chat error: ${error.error?.message ?? 'Unknown error'}`,
    )
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) throw new Error('AI returned an empty response')
  return text.trim()
}
