import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { AuthInput } from '@/components/AuthInput';

const REASONS = [
  { emoji: '🤫', title: 'I need to vent',           subtitle: 'Just talk, no advice' },
  { emoji: '🧠', title: 'Overthinking things',      subtitle: 'Help me sort my thoughts' },
  { emoji: '💬', title: 'Practice conversations',   subtitle: 'Build social confidence' },
  { emoji: '😌', title: 'Just some calm',            subtitle: 'Quiet company is enough' },
] as const;

const MOODS = [
  { emoji: '😔', label: 'Low' },
  { emoji: '😕', label: '' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '🙂', label: '' },
  { emoji: '😊', label: 'Good' },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  function goToStep(next: number) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setCurrentStep(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  const isContinueDisabled =
    loading ||
    (currentStep === 0 && selectedReason === null) ||
    (currentStep === 1 && selectedMood === null) ||
    (currentStep === 2 && displayName.trim().length === 0);

  async function handleComplete() {
    setLoading(true);
    setErrorMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        mood_onboarding: selectedMood !== null ? selectedMood + 1 : null,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    } else {
      router.replace('/(tabs)');
    }
  }

  function handleContinue() {
    if (currentStep < 2) {
      goToStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Progress bar + counter */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor: i <= currentStep ? Colors.accent : Colors.border,
            }} />
          ))}
        </View>
        <Text style={{ color: Colors.textSecondary, fontSize: 13, textAlign: 'right' }}>
          {currentStep + 1} of 3
        </Text>
      </View>

      {/* Animated step content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingTop: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 0 && (
            <Step0 selectedReason={selectedReason} onSelectReason={setSelectedReason} />
          )}
          {currentStep === 1 && (
            <Step1 selectedMood={selectedMood} onSelectMood={setSelectedMood} />
          )}
          {currentStep === 2 && (
            <Step2 displayName={displayName} onChangeName={setDisplayName} loading={loading} />
          )}

          {errorMessage ? (
            <View style={{
              marginTop: 16,
              backgroundColor: '#2D1515',
              borderWidth: 1,
              borderColor: Colors.danger,
              borderRadius: 8,
              padding: 12,
            }}>
              <Text style={{ color: Colors.danger, fontSize: 13 }}>{errorMessage}</Text>
            </View>
          ) : null}
        </ScrollView>
      </Animated.View>

      {/* Bottom navigation */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 16 }}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={isContinueDisabled}
          style={{
            backgroundColor: Colors.accent,
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: isContinueDisabled ? 0.4 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              {currentStep === 2 ? "Let's begin →" : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>

        {currentStep > 0 && !loading && (
          <TouchableOpacity onPress={() => goToStep(currentStep - 1)} style={{ alignItems: 'center' }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Step sub-components ────────────────────────────────────────────────────

function Step0({
  selectedReason,
  onSelectReason,
}: {
  selectedReason: number | null;
  onSelectReason: (idx: number | null) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: Colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 2 }}>
        What brings you to Quietly?
      </Text>
      <Text style={{ color: Colors.textSecondary, fontSize: 15, marginBottom: 8 }}>
        No wrong answers.
      </Text>
      {REASONS.map((reason, idx) => {
        const selected = selectedReason === idx;
        return (
          <TouchableOpacity
            key={idx}
            onPress={() => onSelectReason(selected ? null : idx)}
            style={{
              backgroundColor: selected ? '#1E1B4B' : Colors.card,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: selected ? Colors.accent : Colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Text style={{ fontSize: 24 }}>{reason.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: '600' }}>
                {reason.title}
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {reason.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Step1({
  selectedMood,
  onSelectMood,
}: {
  selectedMood: number | null;
  onSelectMood: (idx: number) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: Colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 2 }}>
        How are you feeling right now?
      </Text>
      <Text style={{ color: Colors.textSecondary, fontSize: 15, marginBottom: 24 }}>
        Be honest. This is just for you.
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {MOODS.map((mood, idx) => {
          const selected = selectedMood === idx;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => onSelectMood(idx)}
              style={{ alignItems: 'center', gap: 8 }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: selected ? Colors.accent : Colors.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 22 }}>{mood.emoji}</Text>
              </View>
              <Text style={{ color: Colors.textSecondary, fontSize: 11, height: 14 }}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Step2({
  displayName,
  onChangeName,
  loading,
}: {
  displayName: string;
  onChangeName: (name: string) => void;
  loading: boolean;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: Colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 2 }}>
        What should I call you?
      </Text>
      <Text style={{ color: Colors.textSecondary, fontSize: 15, marginBottom: 8 }}>
        A first name or a nickname is perfect.
      </Text>
      <AuthInput
        label="Your name"
        value={displayName}
        onChangeText={onChangeName}
        placeholder="Your name..."
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={30}
        editable={!loading}
      />
    </View>
  );
}
