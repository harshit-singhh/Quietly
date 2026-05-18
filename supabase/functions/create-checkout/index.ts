import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'

function getEnvVars() {
  return {
    supabaseUrl: Deno.env.get('SUPABASE_URL')!,
    supabaseAnonKey: Deno.env.get('SUPABASE_ANON_KEY')!,
    serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    razorpayKeyId: Deno.env.get('RAZORPAY_KEY_ID')!,
    razorpayKeySecret: Deno.env.get('RAZORPAY_KEY_SECRET')!,
    razorpayPlanId: Deno.env.get('RAZORPAY_PLAN_ID')!,
    stripeSecretKey: Deno.env.get('STRIPE_SECRET_KEY')!,
    stripePriceId: Deno.env.get('STRIPE_PRICE_ID')!,
    appUrl: Deno.env.get('APP_URL')!,
  }
}

// ── RAZORPAY ──────────────────────────────────────────────────────────────────

async function handleRazorpay(params: {
  env: ReturnType<typeof getEnvVars>
  userId: string
  adminClient: ReturnType<typeof createClient>
}) {
  const { env, userId } = params

  const credentials = btoa(`${env.razorpayKeyId}:${env.razorpayKeySecret}`)

  const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: env.razorpayPlanId,
      quantity: 1,
      total_count: 120, // 10 years max — effectively indefinite
      notes: {
        supabase_user_id: userId,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('Razorpay error:', error)
    return errorResponse('Failed to create Razorpay subscription', 502)
  }

  const subscription = await response.json()

  // Store pending subscription ID for later verification
  await params.adminClient
    .from('profiles')
    .update({
      pending_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return successResponse({
    provider: 'razorpay',
    subscription_id: subscription.id,
    key_id: env.razorpayKeyId, // public key — safe to return
  })
}

// ── STRIPE ────────────────────────────────────────────────────────────────────

async function handleStripe(params: {
  env: ReturnType<typeof getEnvVars>
  userId: string
  userEmail: string
  adminClient: ReturnType<typeof createClient>
}) {
  const { env, userId, userEmail } = params

  // Stripe API uses form-encoded, not JSON
  const stripeBody = new URLSearchParams({
    'mode': 'subscription',
    'line_items[0][price]': env.stripePriceId,
    'line_items[0][quantity]': '1',
    'success_url': `${env.appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    'cancel_url': `${env.appUrl}/payment-cancelled`,
    'customer_email': userEmail,
    'metadata[supabase_user_id]': userId,
    'subscription_data[metadata][supabase_user_id]': userId,
  })

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: stripeBody.toString(),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('Stripe error:', error)
    return errorResponse('Failed to create Stripe checkout session', 502)
  }

  const session = await response.json()

  return successResponse({
    provider: 'stripe',
    checkout_url: session.url,
  })
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const env = getEnvVars()

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Missing authorization header', 401)
    }
    const token = authHeader.replace('Bearer ', '').trim()

    const anonClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token)

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    const adminClient = createClient(env.supabaseUrl, env.serviceRoleKey)

    // Block if already premium
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    if (profile?.is_premium) {
      return errorResponse('User is already a premium subscriber', 400)
    }

    // Parse body
    let body: { country_code?: string }
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    const { country_code } = body

    if (!country_code || typeof country_code !== 'string') {
      return errorResponse('Missing field: country_code', 400)
    }

    const normalizedCountry = country_code.toUpperCase().trim()

    // Route by country: India → Razorpay, elsewhere → Stripe
    if (normalizedCountry === 'IN') {
      return await handleRazorpay({ env, userId: user.id, adminClient })
    } else {
      return await handleStripe({
        env,
        userId: user.id,
        userEmail: user.email ?? '',
        adminClient,
      })
    }
  } catch (err) {
    console.error('Unexpected error in create-checkout:', err)
    return errorResponse('An unexpected error occurred', 500)
  }
})
