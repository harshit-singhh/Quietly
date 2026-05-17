import { supabase } from './supabase';

// API helpers will be added here as features are built.
// All direct Supabase calls and Edge Function fetches go here,
// not inside screen components.

export async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) throw new Error('Not authenticated');

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Edge function call failed');
  }

  return response.json();
}
