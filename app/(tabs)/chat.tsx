import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from '@/components/MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { Colors } from '@/constants/colors';
import type { Message } from '@/types/chat';

type TypingItem = {
  id: 'typing-indicator';
  role: 'typing';
  content: string;
  session_id: string;
  user_id: string;
  created_at: string;
};
type ListItem = Message | TypingItem;

const TYPING_ITEM: TypingItem = {
  id: 'typing-indicator',
  role: 'typing',
  content: '',
  session_id: '',
  user_id: '',
  created_at: '',
};

export default function ChatScreen() {
  const router = useRouter();
  const { session_id } = useLocalSearchParams<{ session_id?: string }>();
  const {
    messages,
    session,
    inputText,
    setInputText,
    isLoading,
    isInitializing,
    sendMessage,
    retryMessage,
  } = useChat(session_id);

  const [inputHeight, setInputHeight] = useState(40);

  const listData = useMemo<ListItem[]>(() => {
    const reversed = [...messages].reverse();
    if (isLoading) return [TYPING_ITEM, ...reversed];
    return reversed;
  }, [messages, isLoading]);

  const renderItem = useCallback(({ item, index }: { item: ListItem; index: number }) => {
    if (item.role === 'typing') return <TypingIndicator />;

    const prevItem = listData[index + 1];
    const prevMessage =
      prevItem && prevItem.role !== 'typing' ? (prevItem as Message) : undefined;

    return (
      <MessageBubble
        message={item}
        prevMessage={prevMessage}
        onRetry={() => retryMessage(item.id)}
      />
    );
  }, [listData, retryMessage]);

  const sendDisabled = !inputText.trim() || isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Header ── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: Colors.card,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
          minHeight: 52,
        }}>
          {session_id ? (
            <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 20 }}>←</Text>
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}

          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 16,
              fontWeight: '600',
              color: session?.title ? Colors.textPrimary : Colors.textSecondary,
            }}
          >
            {session?.title ?? 'New conversation'}
          </Text>

          <Pressable
            onPress={() => router.replace('/(tabs)/chat')}
            style={{ marginLeft: 12, padding: 4 }}
          >
            <Text style={{ color: Colors.accent, fontSize: 22, fontWeight: '300' }}>+</Text>
          </Pressable>
        </View>

        {/* ── Body ── */}
        {isInitializing ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={{ color: Colors.textSecondary, marginTop: 12, fontSize: 14 }}>
              Getting your space ready...
            </Text>
          </View>
        ) : (
          <FlatList
            data={listData}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 8,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState />}
          />
        )}

        {/* ── Input bar ── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          backgroundColor: Colors.card,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Say something..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            maxLength={1000}
            blurOnSubmit={false}
            onSubmitEditing={sendMessage}
            onContentSizeChange={(e) => {
              const h = e.nativeEvent.contentSize.height;
              setInputHeight(Math.max(40, Math.min(h, 80)));
            }}
            style={{
              flex: 1,
              height: inputHeight,
              backgroundColor: Colors.background,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: Colors.textPrimary,
              fontSize: 15,
            }}
          />

          <TouchableOpacity
            onPress={sendMessage}
            disabled={sendDisabled}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              marginLeft: 8,
              backgroundColor: sendDisabled ? Colors.border : Colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 18 }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 60 }}>🤫</Text>
      <Text style={{
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 16,
      }}>
        This is your quiet space.
      </Text>
      <Text style={{
        color: Colors.textSecondary,
        fontSize: 15,
        textAlign: 'center',
        marginTop: 8,
      }}>
        Say anything. No judgment here.
      </Text>
      <Text style={{
        color: Colors.textSecondary,
        fontSize: 13,
        textAlign: 'center',
        marginTop: 8,
      }}>
        Your thoughts stay private.
      </Text>
    </View>
  );
}
