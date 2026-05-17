export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  session_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
  /** Local-only flag for optimistic UI — never stored in Supabase */
  isPending?: boolean;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string | null;
  session_type: 'chat' | 'voice';
  created_at: string;
  last_message_at: string | null;
}
