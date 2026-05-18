import { useEffect, useRef, useState } from 'react';
import { Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

interface PanicOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const PHASES = [
  { text: 'Breathe in...', duration: 4000 },
  { text: 'Hold...', duration: 2000 },
  { text: 'Breathe out...', duration: 6000 },
  { text: 'Rest...', duration: 2000 },
];

export function PanicOverlay({ isVisible, onClose }: PanicOverlayProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const scale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0.3);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isVisible) {
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
      scale.value = 0.8;
      glowOpacity.value = 0.3;
      setPhaseIndex(0);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 4000 }),
        withTiming(1.2, { duration: 2000 }),
        withTiming(0.8, { duration: 6000 }),
        withTiming(0.8, { duration: 2000 }),
      ),
      -1,
      false,
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 4000 }),
        withTiming(0.8, { duration: 2000 }),
        withTiming(0.2, { duration: 6000 }),
        withTiming(0.2, { duration: 2000 }),
      ),
      -1,
      false,
    );

    let idx = 0;
    function scheduleNext() {
      timerRef.current = setTimeout(() => {
        idx = (idx + 1) % PHASES.length;
        setPhaseIndex(idx);
        scheduleNext();
      }, PHASES[idx].duration);
    }
    scheduleNext();

    return () => {
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: 'rgba(5, 5, 15, 0.97)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 15,
            letterSpacing: 1.5,
            marginBottom: 64,
            textTransform: 'uppercase',
          }}
        >
          {PHASES[phaseIndex].text}
        </Text>

        <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: Colors.accent,
              },
              glowStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: '#0D0B1E',
                borderWidth: 2,
                borderColor: Colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              },
              ringStyle,
            ]}
          >
            <Text style={{ fontSize: 44, color: Colors.accent }}>◎</Text>
          </Animated.View>
        </View>

        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: 20,
            fontWeight: '700',
            marginTop: 64,
            textAlign: 'center',
          }}
        >
          You're safe.
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 14,
            marginTop: 10,
            textAlign: 'center',
            lineHeight: 22,
            paddingHorizontal: 48,
          }}
        >
          Follow the circle.{'\n'}Let your breath guide you back.
        </Text>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          style={{
            marginTop: 56,
            paddingHorizontal: 36,
            paddingVertical: 14,
            borderRadius: 32,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>I'm okay now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}
