import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  prevMessage?: Message;
  onRetry?: () => void;
}

export function MessageBubble({ message, prevMessage, onRetry }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const sameSenderAsPrev = prevMessage?.role === message.role;

  const showTimestamp =
    !prevMessage ||
    new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() >
      5 * 60 * 1000;

  const timeStr = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={{
      marginBottom: sameSenderAsPrev ? 4 : 12,
      alignItems: isUser ? 'flex-end' : 'flex-start',
    }}>
      {/* Bubble */}
      <View style={{
        maxWidth: '80%',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 18,
        ...(isUser
          ? {
              backgroundColor: message.isError ? '#2D1515' : Colors.accent,
              borderBottomRightRadius: 4,
              borderWidth: message.isError ? 1 : 0,
              borderColor: message.isError ? Colors.danger : 'transparent',
              opacity: message.isPending ? 0.6 : 1,
            }
          : {
              backgroundColor: Colors.card,
              borderBottomLeftRadius: 4,
              borderWidth: 1,
              borderColor: Colors.border,
            }),
      }}>
        <Text style={{
          color: isUser ? '#ffffff' : Colors.textPrimary,
          fontSize: 15,
          lineHeight: 22,
        }}>
          {message.content}
        </Text>

        {message.isError && (
          <TouchableOpacity onPress={onRetry} style={{ marginTop: 6 }}>
            <Text style={{ color: Colors.danger, fontSize: 12 }}>Tap to retry</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Timestamp */}
      {showTimestamp && timeStr ? (
        <Text style={{
          color: Colors.textSecondary,
          fontSize: 11,
          marginTop: 3,
          alignSelf: isUser ? 'flex-end' : 'flex-start',
        }}>
          {timeStr}
        </Text>
      ) : null}
    </View>
  );
}
