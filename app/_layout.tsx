import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useSession } from '@/hooks/useSession';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';
import '../global.css';

function AuthGuard() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
      }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return <AuthGuard />;
}
