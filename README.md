# Quietly — AI Companion for Introverts

## What this app is
A private AI companion app for introverts and people with social 
anxiety. Users can have text and voice conversations with an 
empathetic AI, share anonymous stories in a community feed, 
and use grounding tools during anxious moments.

## Tech stack
- Expo SDK 51 + Expo Router (iOS, Android, Web)
- NativeWind v4 (Tailwind for React Native)
- TypeScript strict mode
- Supabase (database, auth, edge functions)
- Gemini 2.0 Flash (chat + speech to text)
- Google Cloud TTS Neural2 (text to speech — 1M chars/month free)
- Razorpay (Indian payments) + Stripe (international payments)

## Folder structure
app/              → Expo Router screens
  (auth)/         → login, register, onboarding
  (tabs)/         → home, chat, voice, community
components/       → reusable UI components
hooks/            → custom React hooks (all logic lives here)
lib/              → supabase.ts, api.ts
constants/        → colors.ts, typography.ts
types/            → chat.ts (shared TypeScript types)
supabase/
  functions/      → edge functions (server-side API calls)
    _shared/      → cors.ts, errors.ts, openai.ts
    chat-handler/
    voice-handler/
    create-post/
    create-checkout/
    verify-payment/

## Design system
Background:    #0F1117
Card:          #1A1D27
Border:        #2A2D3A
Accent:        #4F46E5 (indigo — the only accent color)
Text primary:  #F1F5F9
Text secondary:#94A3B8
Danger:        #EF4444
Dark, minimal, low-stimulation. No gradients. No shadows.

## Key rules to follow
- All logic lives in hooks/, never inside screen components
- Screen components stay under 150 lines
- All Supabase DB calls use RLS — never bypass it on the client
- All API keys live in edge functions via Deno.env.get() only
- Never put secret keys in .env.local or any frontend file
- The anon Supabase key is safe for frontend — everything else is not
- Voice and payments are premium-only features
  (checked client-side AND verified server-side independently)

## Database tables
- profiles        → user data, is_premium flag
- chat_sessions   → conversation threads (type: chat or voice)
- messages        → individual messages per session
- user_memories   → AI-extracted insights about the user
- community_posts → anonymous community stories
- post_reactions  → me_too reactions (one per user per post)

## Features
1. Text chat with memory (free)
2. Voice conversation — premium only
3. Community anonymous story feed (free)
4. Panic circuit-breaker with breathing animation (free)
5. Memory panel — view and delete what AI remembers (free)
6. Subscription via Razorpay (India ₹149/mo) or Stripe ($5.99/mo)

## 🌐 Version Control & Repository
- **Remote Origin URL:** `https://github.com/harshit-singhh/Quietly.git`
- **Primary Branch:** `main`
- **Git Rules:** 1. Whenever a multi-file feature pass or complex bug-fix script is successfully implemented, use the local terminal agent to automatically stage the respective components (`git add .`).
  2. Generate a clean, descriptive, conventional commit message (e.g., `feat(ui): implement panic breathing ring visual` or `fix(auth): correct profile RLS routing data token`) and commit the staged block locally (`git commit -m "message"`).
  3. Never run `git push` automatically. Always prompt the user to execute the remote sync manually through their authenticated terminal panel.

## Before you start coding, ask me for
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- GEMINI_API_KEY       (free — aistudio.google.com)
- GOOGLE_TTS_API_KEY   (free tier — console.cloud.google.com)
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_PLAN_ID
- STRIPE_SECRET_KEY
- STRIPE_PRICE_ID
- EXPO_PUBLIC_APP_URL

## Important patterns used throughout
- Auth guard in app/_layout.tsx handles all redirects automatically
- callEdgeFunction() in lib/api.ts is used for all edge function calls
- Every edge function checks JWT auth as its very first step
- Optimistic UI updates on all user actions (no waiting for DB)
- Background memory extraction runs after chat/voice responses
  without blocking the user