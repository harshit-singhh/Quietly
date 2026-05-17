import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import '../global.css';

function AuthGuard() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  // Fetch onboarding status whenever the logged-in user changes
  useEffect(() => {
    if (!session) {
      setOnboardingComplete(null);
      return;
    }
    supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setOnboardingComplete(data?.onboarding_complete ?? false);
      });
  }, [session?.user.id]);

  useEffect(() => {
    if (loading) return;
    // Wait for profile to load when a session exists
    if (session && onboardingComplete === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!session && !inAuthGroup) {
      // Unauthenticated — send to login
      router.replace('/(auth)/login');
    } else if (session && !onboardingComplete && !inTabsGroup) {
      // Authenticated but onboarding not finished — allow onboarding screen itself
      if (segments[1] !== 'onboarding') {
        router.replace('/(auth)/onboarding');
      }
    } else if (session && onboardingComplete && inAuthGroup) {
      // Fully set-up user landed on an auth screen — send to app
      router.replace('/(tabs)');
    }
  }, [session, loading, onboardingComplete, segments, router]);

  const isLoading = loading || (!!session && onboardingComplete === null);

  if (isLoading) {
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
