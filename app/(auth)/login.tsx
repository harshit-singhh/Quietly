import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { AuthInput } from '@/components/AuthInput';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
    // On success: auth listener in _layout.tsx redirects automatically
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <Text style={{ fontSize: 30, color: Colors.textPrimary, fontWeight: '700' }}>
              Quietly
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 15, marginTop: 6 }}>
              Your private space.
            </Text>
          </View>

          {/* Form card */}
          <View style={{
            backgroundColor: Colors.card,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: Colors.border,
            gap: 16,
          }}>
            <AuthInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <AuthInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              editable={!loading}
            />

            {errorMessage ? (
              <View style={{
                backgroundColor: '#2D1515',
                borderWidth: 1,
                borderColor: Colors.danger,
                borderRadius: 8,
                padding: 12,
              }}>
                <Text style={{ color: Colors.danger, fontSize: 13 }}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSignIn}
              disabled={loading}
              style={{
                backgroundColor: Colors.accent,
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 24,
          }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={{ color: Colors.accent, fontSize: 15 }}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
