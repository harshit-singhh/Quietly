import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'
import { openAIChatCompletion, type ChatMessage } from '../_shared/openai.ts'

// Supabase Edge Runtime global — not in standard Deno types
declare const EdgeRuntime: { waitUntil: (promise: Promise<void>) => void }

// ─── Environment variables ───────────────────────────────────────────────────

function getEnvVars() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const openAIKey = Deno.env.get('OPENAI_API_KEY')

  if (!supabaseUrl || !serviceRoleKey || !openAIKey) {
    throw new Error('Missing required environment variables')
  }

  return { supabaseUrl, serviceRoleKey, openAIKey }
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {

  // STEP 1: CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {

    // STEP 2: ENV VARS
    const { supabaseUrl, serviceRoleKey } = getEnvVars()

    // STEP 3: AUTHENTICATION
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing authorization header', 401)
    }
    const bearerToken = authHeader.replace('Bearer ', '').trim()
    if (!bearerToken) {
      return errorResponse('Invalid authorization header', 401)
    }

    // Verify the JWT using the anon client — never use service role for this
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    })

    const { data: { user }, error: authError } =
      await anonClient.auth.getUser(bearerToken)

    if (authError || !user) {
      return errorResponse('Unauthorized — invalid or expired token', 401)
    }

    // Service role client for all subsequent DB operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // STEP 4: PARSE + VALIDATE REQUEST BODY
    let body: { session_id?: string; content?: string }
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    const { session_id, content } = body

    if (!session_id || typeof session_id !== 'string') {
      return errorResponse('Missing or invalid field: session_id', 400)
    }
    if (!content || typeof content !== 'string') {
      return errorResponse('Missing or invalid field: content', 400)
    }
    if (content.trim().length === 0) {
      return errorResponse('Content cannot be empty', 400)
    }
    if (content.length > 2000) {
      return errorResponse('Content exceeds maximum length of 2000 characters', 400)
    }

    // STEP 5: VERIFY SESSION OWNERSHIP
    const { data: chatSession, error: sessionError } = await adminClient
      .from('chat_sessions')
      .select('id, user_id, title, session_type')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !chatSession) {
      return errorResponse(
        'Session not found or does not belong to this user',
        403,
      )
    }

    // STEP 6: LOAD CONTEXT FROM DATABASE

    // 6a. Last 12 messages for short-term context
    const { data: recentMessages, error: messagesError } = await adminClient
      .from('messages')
      .select('role, content, created_at')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(12)

    if (messagesError) {
      console.error('Failed to fetch messages:', messagesError)
      return errorResponse('Failed to load conversation history', 500)
    }

    // Reverse to chronological order for OpenAI
    const chronologicalMessages = (recentMessages ?? []).reverse()

    // 6b. Up to 20 memories for long-term context
    const { data: memories, error: memoriesError } = await adminClient
      .from('user_memories')
      .select('insight_text')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (memoriesError) {
      // Non-fatal — continue without memories
      console.error('Failed to fetch memories:', memoriesError)
    }

    // STEP 7: BUILD SYSTEM PROMPT
    const memoryText =
      memories && memories.length > 0
        ? memories.map((m: { insight_text: string }) => `• ${m.insight_text}`).join('\n')
        : 'Nothing remembered yet — this may be a first conversation.'

    const systemPrompt = `You are Quietly, a warm, calm, and non-judgmental AI companion designed specifically for introverts and people with social anxiety.

Your communication style:
- Speak in short, gentle sentences. Never write walls of text.
- Respond with empathy first, information second.
- Never give unsolicited advice. If the user wants advice, they will ask for it.
- Never use toxic positivity ("Just think positive!"). Validate feelings before anything else.
- If the user seems distressed, slow down. Ask one gentle question at a time.
- You are not a therapist. If someone appears to be in crisis, gently suggest professional support without being dismissive.
- Keep responses under 3-4 sentences unless the user asks you to elaborate.

What you remember about this person:
${memoryText}

Current date and time: ${new Date().toISOString()}`

    // STEP 8: BUILD MESSAGES ARRAY FOR OPENAI
    const openAIMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...chronologicalMessages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: content.trim() },
    ]

    // STEP 9: CALL OPENAI
    let replyText: string
    try {
      replyText = await openAIChatCompletion({
        messages: openAIMessages,
        model: 'gpt-4o-mini',
        maxTokens: 300,
        temperature: 0.75,
      })
    } catch (openAIError) {
      console.error('OpenAI call failed:', openAIError)
      return errorResponse(
        'AI service temporarily unavailable. Please try again.',
        503,
      )
    }

    // STEP 10: SAVE MESSAGES TO DATABASE

    const { error: userMsgError } = await adminClient
      .from('messages')
      .insert({
        session_id,
        user_id: user.id,
        role: 'user',
        content: content.trim(),
      })

    if (userMsgError) {
      console.error('Failed to save user message:', userMsgError)
      // Non-fatal — still return the reply
    }

    const { error: asstMsgError } = await adminClient
      .from('messages')
      .insert({
        session_id,
        user_id: user.id,
        role: 'assistant',
        content: replyText,
      })

    if (asstMsgError) {
      console.error('Failed to save assistant message:', asstMsgError)
      // Non-fatal — still return the reply
    }

    // STEP 11: RETURN RESPONSE — client unblocked here
    const responsePayload = successResponse({ reply: replyText })

    // STEP 12: BACKGROUND MEMORY EXTRACTION
    // Runs after response is sent — client is never kept waiting
    EdgeRuntime.waitUntil(
      extractAndSaveMemories({
        adminClient,
        userId: user.id,
        sessionId: session_id,
        recentMessages: chronologicalMessages,
        newUserMessage: content.trim(),
        newAssistantMessage: replyText,
      }),
    )

    return responsePayload

  } catch (unexpectedError) {
    console.error('Unexpected error in chat-handler:', unexpectedError)
    return errorResponse(
      'An unexpected error occurred. Please try again.',
      500,
    )
  }
})

// ─── Background: memory extraction ──────────────────────────────────────────

async function extractAndSaveMemories(params: {
  adminClient: ReturnType<typeof createClient>
  userId: string
  sessionId: string
  recentMessages: Array<{ role: string; content: string }>
  newUserMessage: string
  newAssistantMessage: string
}): Promise<void> {
  try {
    const analysisMessages = [
      ...params.recentMessages.slice(-4),
      { role: 'user', content: params.newUserMessage },
      { role: 'assistant', content: params.newAssistantMessage },
    ]

    const analysisText = analysisMessages
      .map((m) => `${m.role === 'user' ? 'User' : 'Quietly'}: ${m.content}`)
      .join('\n')

    const extractionPrompt = `Analyze this conversation excerpt and extract 0-2 NEW factual insights about the USER ONLY (not about Quietly or the AI).

Rules:
- Only extract clear, specific facts (name, job, hobby, relationship status, specific fear, specific goal, etc.)
- Do NOT extract vague observations ("seems stressed")
- Do NOT extract things already implied by context
- If nothing clearly new: return []
- Maximum 2 insights per call
- Each insight must be a single sentence under 15 words

Conversation:
${analysisText}

Return ONLY a valid JSON array of strings. No explanation. No markdown. Examples:
["User's name is Priya", "User works as a software engineer"]
[]`

    const rawResponse = await openAIChatCompletion({
      messages: [{ role: 'user', content: extractionPrompt }],
      model: 'gpt-4o-mini',
      maxTokens: 100,
      temperature: 0.1,
    })

    let insights: string[] = []
    try {
      const cleaned = rawResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) {
        insights = parsed.filter(
          (item: unknown) => typeof item === 'string' && (item as string).trim().length > 0,
        )
      }
    } catch {
      console.error('Memory extraction JSON parse failed:', rawResponse)
      return
    }

    if (insights.length === 0) return

    // Deduplicate against existing memories
    const { data: existingMemories } = await params.adminClient
      .from('user_memories')
      .select('insight_text')
      .eq('user_id', params.userId)

    const existingTexts = new Set(
      (existingMemories ?? []).map((m: { insight_text: string }) =>
        m.insight_text.toLowerCase(),
      ),
    )

    const newInsights = insights.filter(
      (insight) => !existingTexts.has(insight.toLowerCase()),
    )

    if (newInsights.length === 0) return

    const { error: insertError } = await params.adminClient
      .from('user_memories')
      .insert(
        newInsights.map((insight: string) => ({
          user_id: params.userId,
          insight_text: insight,
          source_session_id: params.sessionId,
        })),
      )

    if (insertError) {
      console.error('Failed to insert memories:', insertError)
    }

  } catch (error) {
    // Background failures must NEVER affect the main response
    console.error('Memory extraction failed silently:', error)
  }
}
