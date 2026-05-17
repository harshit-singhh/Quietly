import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  autoCorrect?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  maxLength?: number;
  editable?: boolean;
}

export function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  returnKeyType,
  onSubmitEditing,
  autoFocus,
  maxLength,
  editable = true,
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text style={{
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 6,
      }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        maxLength={maxLength}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: Colors.background,
          borderWidth: 1,
          borderColor: focused ? Colors.accent : Colors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: Colors.textPrimary,
          fontSize: 15,
        }}
      />
    </View>
  );
}
