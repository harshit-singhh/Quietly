// Centralizes all OpenAI API calls so the key and base URL
// are never repeated across edge functions.

const OPENAI_API_URL = 'https://api.openai.com/v1'

function getOpenAIKey(): string {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) throw new Error('OPENAI_API_KEY is not set')
  return key
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function openAIChatCompletion(params: {
  messages: ChatMessage[]
  model?: string
  maxTokens?: number
  temperature?: number
}): Promise<string> {
  const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getOpenAIKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model ?? 'gpt-4o-mini',
      max_tokens: params.maxTokens ?? 500,
      temperature: params.temperature ?? 0.7,
      messages: params.messages,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `OpenAI API error: ${error.error?.message ?? 'Unknown error'}`,
    )
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('OpenAI returned an empty response')
  }

  return content.trim()
}

/** Reserved for voice-handler. */
export async function openAITTS(params: {
  input: string
  voice?: string
  model?: string
}): Promise<ArrayBuffer> {
  const response = await fetch(`${OPENAI_API_URL}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getOpenAIKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model ?? 'tts-1-hd',
      voice: params.voice ?? 'nova',
      input: params.input,
      response_format: 'mp3',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `OpenAI TTS error: ${error.error?.message ?? 'Unknown error'}`,
    )
  }

  return response.arrayBuffer()
}

/** Reserved for voice-handler. */
export async function openAIWhisper(audioBlob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.mp3')
  formData.append('model', 'whisper-1')

  const response = await fetch(`${OPENAI_API_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getOpenAIKey()}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Whisper error: ${error.error?.message ?? 'Unknown error'}`,
    )
  }

  const data = await response.json()
  return data.text ?? ''
}
