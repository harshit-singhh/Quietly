import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatSession } from '@/types/chat';

type Memory = { id: string; insight_text: string; created_at: string };
type Profile = { display_name: string | null; is_premium: boolean };

export function useDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [isPanicOpen, setIsPanicOpen] = useState(false);
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    userIdRef.current = user.id;
    await Promise.all([loadProfile(), loadSessions(), loadMemories()]);
  }

  async function loadProfile() {
    if (!userIdRef.current) return;
    const { data } = await supabase
      .from('profiles')
      .select('display_name, is_premium')
      .eq('id', userIdRef.current)
      .single();
    if (data) setProfile(data as Profile);
  }

  const loadSessions = useCallback(async () => {
    if (!userIdRef.current) return;
    setIsLoadingSessions(true);
    const { data } = await supabase
      .from('chat_sessions')
      .select('id, title, session_type, created_at, last_message_at')
      .eq('user_id', userIdRef.current)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(20);
    setSessions((data as ChatSession[]) ?? []);
    setIsLoadingSessions(false);
  }, []);

  const loadMemories = useCallback(async () => {
    if (!userIdRef.current) return;
    setIsLoadingMemories(true);
    const { data } = await supabase
      .from('user_memories')
      .select('id, insight_text, created_at')
      .eq('user_id', userIdRef.current)
      .order('created_at', { ascending: false });
    setMemories((data as Memory[]) ?? []);
    setIsLoadingMemories(false);
  }, []);

  async function deleteMemory(memoryId: string) {
    const prev = [...memories];
    setMemories(prev.filter(m => m.id !== memoryId));
    const { error } = await supabase
      .from('user_memories')
      .delete()
      .eq('id', memoryId);
    if (error) setMemories(prev);
  }

  async function clearAllMemories() {
    if (!userIdRef.current) return;
    const prev = [...memories];
    setMemories([]);
    const { error } = await supabase
      .from('user_memories')
      .delete()
      .eq('user_id', userIdRef.current);
    if (error) {
      setMemories(prev);
    }
  }

  async function deleteSession(sessionId: string) {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);
    if (error) loadSessions();
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return {
    profile,
    sessions,
    memories,
    isLoadingSessions,
    isLoadingMemories,
    isPanicOpen,
    setIsPanicOpen,
    isMemoryPanelOpen,
    setIsMemoryPanelOpen,
    loadSessions,
    loadMemories,
    deleteMemory,
    clearAllMemories,
    deleteSession,
    signOut,
  };
}
