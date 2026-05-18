import { Alert, Pressable, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import type { ChatSession } from '@/types/chat';

interface SessionCardProps {
  session: ChatSession;
  onPress: () => void;
  onDelete: () => void;
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const msgDayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDayStart.getTime() === todayStart.getTime()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (msgDayStart.getTime() === yesterdayStart.getTime()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function SessionCard({ session, onPress, onDelete }: SessionCardProps) {
  const icon = session.session_type === 'voice' ? '🎙️' : '💬';

  function handleLongPress() {
    Alert.alert('Conversation', undefined, [
      {
        text: 'Delete this conversation',
        style: 'destructive',
        onPress: onDelete,
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#1F2235' : Colors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#1A1740',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        {session.title ? (
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }}
          >
            {session.title}
          </Text>
        ) : (
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: '600', color: Colors.textSecondary, fontStyle: 'italic' }}
          >
            Conversation
          </Text>
        )}
        <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
          {formatTimestamp(session.last_message_at ?? session.created_at)}
        </Text>
      </View>

      <Text style={{ color: Colors.textSecondary, fontSize: 20 }}>›</Text>
    </Pressable>
  );
}
