import { corsHeaders } from './cors.ts'

export function errorResponse(
  message: string,
  status: number,
  details?: unknown,
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      ...(details ? { details } : {}),
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  )
}

export function successResponse(data: unknown): Response {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  )
}
