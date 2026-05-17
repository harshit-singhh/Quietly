import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/lib/api';
import type { Message, ChatSession } from '@/types/chat';

export function useChat(sessionIdParam?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initializeSession() {
    setIsInitializing(true);

    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) {
      setIsInitializing(false);
      return;
    }
    setUserId(authSession.user.id);

    let currentSession: ChatSession | null = null;

    if (sessionIdParam) {
      const { data } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionIdParam)
        .eq('user_id', authSession.user.id)
        .single();
      if (data) currentSession = data as ChatSession;
    }

    if (!currentSession) {
      const { data, error: insertError } = await supabase
        .from('chat_sessions')
        .insert({ user_id: authSession.user.id, session_type: 'chat' })
        .select()
        .single();
      if (insertError) {
        setError(insertError.message);
        setIsInitializing(false);
        return;
      }
      currentSession = data as ChatSession;
    }

    setSession(currentSession);

    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', currentSession.id)
      .order('created_at', { ascending: true });

    setMessages((messagesData as Message[]) ?? []);
    setIsInitializing(false);
  }

  async function sendContent(content: string) {
    if (!session || !userId) return;

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      session_id: session.id,
      user_id: userId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      isPending: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setIsLoading(true);

    try {
      const result = await callEdgeFunction<{ reply: string; messageId: string }>(
        'chat-handler',
        { session_id: session.id, content },
      );

      setMessages(prev =>
        prev.map(msg => msg.id === optimisticId ? { ...msg, isPending: false } : msg),
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        session_id: session.id,
        user_id: userId,
        role: 'assistant',
        content: result.reply,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Auto-title from first user message
      if (!session.title) {
        const truncated = content.length > 30 ? content.slice(0, 30) + '...' : content;
        await supabase
          .from('chat_sessions')
          .update({ title: truncated })
          .eq('id', session.id);
        setSession(prev => prev ? { ...prev, title: truncated } : prev);
      }
    } catch {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticId ? { ...msg, isPending: false, isError: true } : msg,
        ),
      );
    }

    setIsLoading(false);
  }

  async function sendMessage() {
    if (!inputText.trim() || isLoading || !session) return;
    const content = inputText.trim();
    setInputText('');
    await sendContent(content);
  }

  function retryMessage(messageId: string) {
    const failed = messages.find(m => m.id === messageId);
    if (!failed) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    sendContent(failed.content);
  }

  return {
    messages,
    session,
    inputText,
    setInputText,
    isLoading,
    isInitializing,
    error,
    sendMessage,
    retryMessage,
  };
}
