import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'

function getEnvVars() {
  return {
    supabaseUrl: Deno.env.get('SUPABASE_URL')!,
    supabaseAnonKey: Deno.env.get('SUPABASE_ANON_KEY')!,
    serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    razorpayKeySecret: Deno.env.get('RAZORPAY_KEY_SECRET')!,
    stripeSecretKey: Deno.env.get('STRIPE_SECRET_KEY')!,
  }
}

type RequestBody = {
  provider: string
  razorpay_payment_id?: string
  razorpay_subscription_id?: string
  razorpay_signature?: string
  stripe_session_id?: string
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const env = getEnvVars()

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401)
    }
    const token = authHeader.replace('Bearer ', '').trim()

    const anonClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
    if (authError || !user) return errorResponse('Unauthorized', 401)

    const adminClient = createClient(env.supabaseUrl, env.serviceRoleKey)

    // Parse body
    let body: RequestBody
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    // ── RAZORPAY VERIFICATION ─────────────────────────────────────────────────
    if (body.provider === 'razorpay') {
      const {
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
      } = body

      if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
        return errorResponse('Missing Razorpay payment fields', 400)
      }

      // Verify: HMAC-SHA256(subscription_id + '|' + payment_id, key_secret)
      const message = `${razorpay_subscription_id}|${razorpay_payment_id}`
      const encoder = new TextEncoder()

      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(env.razorpayKeySecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      )

      const rawSignature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(message),
      )

      const expectedSignature = Array.from(new Uint8Array(rawSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      if (expectedSignature !== razorpay_signature) {
        return errorResponse('Invalid payment signature', 400)
      }

      // Signature valid — activate premium
      await adminClient
        .from('profiles')
        .update({
          is_premium: true,
          pending_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      return successResponse({ activated: true })

    // ── STRIPE VERIFICATION ───────────────────────────────────────────────────
    } else if (body.provider === 'stripe') {
      const { stripe_session_id } = body

      if (!stripe_session_id) {
        return errorResponse('Missing stripe_session_id', 400)
      }

      // Verify directly with Stripe — never trust the frontend
      const stripeResponse = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${stripe_session_id}`,
        {
          headers: {
            'Authorization': `Bearer ${env.stripeSecretKey}`,
          },
        },
      )

      if (!stripeResponse.ok) {
        return errorResponse('Could not verify Stripe session', 502)
      }

      const stripeSession = await stripeResponse.json()

      if (stripeSession.payment_status !== 'paid') {
        return errorResponse('Payment not completed', 400)
      }

      if (stripeSession.metadata?.supabase_user_id !== user.id) {
        return errorResponse('Session does not belong to this user', 403)
      }

      // Activate premium
      await adminClient
        .from('profiles')
        .update({
          is_premium: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      return successResponse({ activated: true })

    } else {
      return errorResponse('Unknown payment provider', 400)
    }
  } catch (err) {
    console.error('Unexpected error in verify-payment:', err)
    return errorResponse('An unexpected error occurred', 500)
  }
})
