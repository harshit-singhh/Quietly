import { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

const GROUNDING_STEPS = [
  {
    count: 5,
    sense: 'things you can SEE',
    instruction: 'Look around slowly. Name them in your head.',
    color: '#6366F1',
  },
  {
    count: 4,
    sense: 'things you can TOUCH',
    instruction: 'Feel the texture. Notice the temperature.',
    color: '#8B5CF6',
  },
  {
    count: 3,
    sense: 'things you can HEAR',
    instruction: 'Listen past the obvious sounds.',
    color: '#A78BFA',
  },
  {
    count: 2,
    sense: 'things you can SMELL',
    instruction: 'Take a slow breath through your nose.',
    color: '#C4B5FD',
  },
  {
    count: 1,
    sense: 'thing you can TASTE',
    instruction: 'Notice what is already there.',
    color: '#DDD6FE',
  },
];

interface PanicOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export function PanicOverlay({ isVisible, onClose }: PanicOverlayProps) {
  const [breathPhase, setBreathPhase] = useState('Breathe in...');
  const [groundingStep, setGroundingStep] = useState(0);
  const groundingStepRef = useRef(0);
  const stepOpacity = useRef(new RNAnimated.Value(1)).current;
  const groundingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);

  const scale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.2);

  // Ring animation starts on mount, loops indefinitely
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withDelay(1000, withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.ease) })),
      ),
      -1,
      false,
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 4000 }),
        withDelay(1000, withTiming(0.2, { duration: 4000 })),
      ),
      -1,
      false,
    );
  }, []);

  // Breathing label tracks a 9-second cycle (0-3s in, 4s hold, 5-8s out)
  useEffect(() => {
    if (!isVisible) {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
      secondsRef.current = 0;
      setBreathPhase('Breathe in...');
      return;
    }
    secondsRef.current = 0;
    setBreathPhase('Breathe in...');
    breathIntervalRef.current = setInterval(() => {
      secondsRef.current = (secondsRef.current + 1) % 9;
      const s = secondsRef.current;
      if (s <= 3) setBreathPhase('Breathe in...');
      else if (s === 4) setBreathPhase('Hold...');
      else setBreathPhase('Breathe out...');
    }, 1000);
    return () => {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    };
  }, [isVisible]);

  // Grounding auto-advances every 8 seconds, stops at step 4
  useEffect(() => {
    if (!isVisible) {
      if (groundingIntervalRef.current) clearInterval(groundingIntervalRef.current);
      return;
    }
    groundingIntervalRef.current = setInterval(() => {
      if (groundingStepRef.current >= 4) {
        if (groundingIntervalRef.current) clearInterval(groundingIntervalRef.current);
        return;
      }
      RNAnimated.timing(stepOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        groundingStepRef.current = Math.min(groundingStepRef.current + 1, 4);
        setGroundingStep(groundingStepRef.current);
        RNAnimated.timing(stepOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 8000);
    return () => {
      if (groundingIntervalRef.current) clearInterval(groundingIntervalRef.current);
    };
  }, [isVisible]);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: ringOpacity.value,
  }));

  const middleRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [1, 1.35], [1, 1.18]) }],
  }));

  function handleClose() {
    groundingStepRef.current = 0;
    setGroundingStep(0);
    stepOpacity.setValue(1);
    secondsRef.current = 0;
    setBreathPhase('Breathe in...');
    onClose();
  }

  const step = GROUNDING_STEPS[groundingStep];

  const overlayContent = (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Dismiss button */}
      <TouchableOpacity
        onPress={handleClose}
        style={{
          position: 'absolute',
          top: 56,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <Text style={{ color: 'white', fontSize: 18 }}>✕</Text>
      </TouchableOpacity>

      {/* Centered content */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        {/* Three concentric breathing rings */}
        <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                width: 200,
                height: 200,
                borderRadius: 100,
                borderWidth: 2,
                borderColor: Colors.accent,
                backgroundColor: 'rgba(79, 70, 229, 0.08)',
              },
              outerRingStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 25,
                left: 25,
                width: 150,
                height: 150,
                borderRadius: 75,
                borderWidth: 1.5,
                borderColor: Colors.accentLight,
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
              },
              middleRingStyle,
            ]}
          />
          <View
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: Colors.accent,
              opacity: 0.9,
            }}
          />
        </View>

        {/* Breathing phase label */}
        <Text
          style={{
            color: 'white',
            fontSize: 22,
            fontWeight: '300',
            textAlign: 'center',
            letterSpacing: 1,
            marginTop: 40,
          }}
        >
          {breathPhase}
        </Text>

        {/* Grounding guide — fades between steps */}
        <RNAnimated.View
          style={{ opacity: stepOpacity, alignItems: 'center', marginTop: 32 }}
        >
          <Text
            style={{
              fontSize: 72,
              fontWeight: '800',
              color: step.color,
              lineHeight: 80,
              textAlign: 'center',
            }}
          >
            {step.count}
          </Text>
          <Text
            style={{
              fontSize: 18,
              color: 'white',
              fontWeight: '500',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {step.sense}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
              marginTop: 6,
              lineHeight: 20,
            }}
          >
            {step.instruction}
          </Text>

          {/* Progress dots */}
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginTop: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {GROUNDING_STEPS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === groundingStep ? 8 : 6,
                  height: i === groundingStep ? 8 : 6,
                  borderRadius: i === groundingStep ? 4 : 3,
                  backgroundColor:
                    i === groundingStep ? 'white' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </View>
        </RNAnimated.View>
      </View>
    </SafeAreaView>
  );

  return (
    <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
      {Platform.OS === 'android' ? (
        <View style={{ flex: 1, backgroundColor: 'rgba(10, 10, 20, 0.95)' }}>
          {overlayContent}
        </View>
      ) : (
        <BlurView intensity={90} tint="dark" style={{ flex: 1 }}>
          {overlayContent}
        </BlurView>
      )}
    </Modal>
  );
}
