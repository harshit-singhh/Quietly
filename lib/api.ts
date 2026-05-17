import { supabase } from './supabase';

/**
 * Generic helper for calling Supabase Edge Functions with auth.
 * All edge functions require a valid JWT — this attaches it automatically.
 */
export async function callEdgeFunction<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(functionName, {
    body,
  });

  if (error) {
    throw new Error(error.message ?? `Edge function "${functionName}" failed`);
  }

  return data as T;
}
