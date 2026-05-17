import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { AuthInput } from '@/components/AuthInput';

function getPasswordStrength(pwd: string): { pct: number; color: string } {
  if (pwd.length < 6)  return { pct: 0,   color: 'transparent' };
  if (pwd.length < 8)  return { pct: 33,  color: '#EF4444' };
  if (pwd.length < 10) return { pct: 66,  color: '#F59E0B' };
  return                      { pct: 100, color: '#22C55E' };
}

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [strengthColor, setStrengthColor] = useState('transparent');

  const strengthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const { pct, color } = getPasswordStrength(password);
    setStrengthColor(color);
    Animated.timing(strengthAnim, {
      toValue: pct,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [password]);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleRegister() {
    if (!email.trim()) {
      setErrorMessage('Please enter your email');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }
    setLoading(true);
    setErrorMessage('');
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    } else {
      router.replace('/(auth)/onboarding');
    }
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
              Create your private space.
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

            {/* Password + strength bar */}
            <View style={{ gap: 8 }}>
              <AuthInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                editable={!loading}
              />
              <View style={{
                height: 3,
                backgroundColor: Colors.border,
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <Animated.View style={{
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: strengthColor,
                  width: strengthAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                }} />
              </View>
            </View>

            {/* Confirm password */}
            <View style={{ gap: 6 }}>
              <AuthInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                editable={!loading}
              />
              {passwordMismatch ? (
                <Text style={{ color: Colors.danger, fontSize: 12 }}>
                  Passwords don't match
                </Text>
              ) : null}
            </View>

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
              onPress={handleRegister}
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
                  Create Account
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
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={{ color: Colors.accent, fontSize: 15 }}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
