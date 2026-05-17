import { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { Colors } from '@/constants/colors';

export function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 300, useNativeDriver: true }),
        ]),
      );

    const a1 = createBounce(dot1, 0);
    const a2 = createBounce(dot2, 150);
    const a3 = createBounce(dot3, 300);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dot = (anim: Animated.Value) => (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.textSecondary,
        marginHorizontal: 3,
        transform: [{ translateY: anim }],
      }}
    />
  );

  return (
    <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
      <View style={{
        backgroundColor: Colors.card,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        {dot(dot1)}
        {dot(dot2)}
        {dot(dot3)}
      </View>
    </View>
  );
}
