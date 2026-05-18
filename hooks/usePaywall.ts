import { useState } from 'react';
import * as Localization from 'expo-localization';
import * as WebBrowser from 'expo-web-browser';
import { callEdgeFunction } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export type RazorpayCheckoutData = {
  subscriptionId: string;
  keyId: string;
};

type CheckoutResult = {
  provider: 'razorpay' | 'stripe';
  subscription_id?: string;
  key_id?: string;
  checkout_url?: string;
};

export function usePaywall() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [razorpayCheckoutData, setRazorpayCheckoutData] =
    useState<RazorpayCheckoutData | null>(null);

  // Detect country from device locale — e.g. 'IN', 'US', 'GB'
  const countryCode = Localization.getLocales()[0]?.regionCode ?? 'US';
  const isIndianUser = countryCode === 'IN';
  const price = isIndianUser ? '₹149/month' : '$5.99/month';

  async function subscribe() {
    setIsLoading(true);
    setError(null);
    setRazorpayCheckoutData(null);

    try {
      const result = await callEdgeFunction<CheckoutResult>('create-checkout', {
        country_code: countryCode,
      });

      if (result.provider === 'razorpay') {
        await handleRazorpayCheckout({
          subscriptionId: result.subscription_id!,
          keyId: result.key_id!,
        });
      } else {
        await handleStripeCheckout(result.checkout_url!);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Payment failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Sets checkout data — modal watches this to open RazorpayWebView
  async function handleRazorpayCheckout(params: {
    subscriptionId: string;
    keyId: string;
  }) {
    setRazorpayCheckoutData(params);
  }

  async function handleStripeCheckout(checkoutUrl: string) {
    const result = await WebBrowser.openAuthSessionAsync(
      checkoutUrl,
      `${process.env.EXPO_PUBLIC_APP_URL ?? 'https://quietly.pro'}/payment-success`,
    );

    if (result.type === 'success') {
      const url = new URL(result.url);
      const sessionId = url.searchParams.get('session_id');

      if (sessionId) {
        await verifyAndActivate({
          provider: 'stripe',
          stripeSessionId: sessionId,
        });
      }
    }
  }

  async function verifyAndActivate(params: {
    provider: 'stripe' | 'razorpay';
    stripeSessionId?: string;
    razorpayPaymentId?: string;
    razorpaySubscriptionId?: string;
    razorpaySignature?: string;
  }) {
    try {
      await callEdgeFunction('verify-payment', {
        provider: params.provider,
        stripe_session_id: params.stripeSessionId,
        razorpay_payment_id: params.razorpayPaymentId,
        razorpay_subscription_id: params.razorpaySubscriptionId,
        razorpay_signature: params.razorpaySignature,
      });

      // Refresh local session to pick up is_premium change
      await supabase.auth.refreshSession();
      setIsSuccess(true);
    } catch {
      setError('Could not verify payment. Please contact support.');
    }
  }

  return {
    countryCode,
    isIndianUser,
    price,
    isLoading,
    error,
    isSuccess,
    razorpayCheckoutData,
    subscribe,
    verifyAndActivate,
  };
}
