import { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useDashboard } from '@/hooks/useDashboard';
import { SessionCard } from '@/components/SessionCard';
import { PanicOverlay } from '@/components/PanicOverlay';
import { MemoryPanel } from '@/components/MemoryPanel';
import { PaywallModal } from '@/components/PaywallModal';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  Animated.loop(
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.8, duration: 600, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
    ]),
  ).start();
  return (
    <Animated.View
      style={{
        height: 68,
        backgroundColor: Colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        opacity,
      }}
    />
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);
  const {
    profile, sessions, memories,
    isLoadingSessions, isLoadingMemories,
    isPanicOpen, setIsPanicOpen,
    isMemoryPanelOpen, setIsMemoryPanelOpen,
    loadSessions, loadMemories,
    deleteMemory, clearAllMemories, deleteSession, signOut,
  } = useDashboard();

  const greeting = `${getGreeting()}, ${profile?.display_name ?? 'there'} 👋`;
  const subtext = sessions.length === 0
    ? "This is your quiet space. Start whenever you're ready."
    : `You have ${sessions.length} conversation${sessions.length !== 1 ? 's' : ''}. Welcome back.`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* TOP BAR */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 }}>Quietly</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setIsMemoryPanelOpen(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsPanicOpen(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E1040', borderWidth: 1.5, borderColor: Colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, color: Colors.accent }}>◎</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* GREETING CARD */}
        <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 20, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.accent, opacity: 0.12 }} />
          <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.textPrimary }}>{greeting}</Text>
          <Text style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginTop: 8 }}>{subtext}</Text>
          {profile?.is_premium && (
            <View style={{ marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#1E1B4B', borderWidth: 1, borderColor: Colors.accent, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.accent }}>✦ Premium</Text>
            </View>
          )}
        </View>

        {/* QUICK ACTIONS */}
        <View style={{ flexDirection: 'row', marginTop: 16, marginHorizontal: 20, gap: 10 }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/chat')} style={{ flex: 1, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, height: 80, justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 24 }}>💬</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textPrimary }}>Text Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!profile?.is_premium) {
                setShowPaywall(true);
              } else {
                router.push('/(tabs)/voice');
              }
            }}
            style={{ flex: 1, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, height: 80, justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 24 }}>🎙️</Text>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textPrimary }}>Voice Chat</Text>
              <Text style={{ fontSize: 11, color: Colors.accent }}>Premium</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* SESSIONS SECTION */}
        <View style={{ marginTop: 24, marginHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary }}>Recent</Text>
            {sessions.length > 0 && <Text style={{ fontSize: 14, color: Colors.accent }}>See all</Text>}
          </View>

          {isLoadingSessions ? (
            <View style={{ gap: 8 }}>
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </View>
          ) : sessions.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: Colors.textSecondary, textAlign: 'center' }}>No conversations yet</Text>
              <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 }}>Tap below to start your first one.</Text>
            </View>
          ) : (
            <FlatList
              data={sessions}
              scrollEnabled={false}
              keyExtractor={item => item.id}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <SessionCard
                  session={item}
                  onPress={() => router.push({ pathname: '/(tabs)/chat', params: { session_id: item.id } })}
                  onDelete={() => deleteSession(item.id)}
                />
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* NEW CONVERSATION BUTTON */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, padding: 12, paddingHorizontal: 20, paddingBottom: 28 }}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/chat')} style={{ height: 52, backgroundColor: Colors.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>+ New Conversation</Text>
        </TouchableOpacity>
      </View>

      <PanicOverlay isVisible={isPanicOpen} onClose={() => setIsPanicOpen(false)} />
      <MemoryPanel
        isVisible={isMemoryPanelOpen}
        memories={memories}
        isLoading={isLoadingMemories}
        onDeleteMemory={deleteMemory}
        onClearAll={clearAllMemories}
        onClose={() => setIsMemoryPanelOpen(false)}
        signOut={signOut}
      />
      <PaywallModal
        isVisible={showPaywall}
        featureName="Voice Chat"
        onClose={() => setShowPaywall(false)}
        onSuccess={() => {
          setShowPaywall(false);
          router.push('/(tabs)/voice');
        }}
      />
    </SafeAreaView>
  );
}
