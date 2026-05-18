import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';

type Memory = { id: string; insight_text: string; created_at: string };

interface MemoryPanelProps {
  isVisible: boolean;
  memories: Memory[];
  isLoading: boolean;
  onDeleteMemory: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  signOut: () => Promise<void>;
}

function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const hours = diffMs / (1000 * 60 * 60);
  if (hours < 1) return 'Just now';
  if (hours < 24) {
    const h = Math.floor(hours);
    return `${h} hour${h !== 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function MemoryPanel({
  isVisible,
  memories,
  isLoading,
  onDeleteMemory,
  onClearAll,
  onClose,
  signOut,
}: MemoryPanelProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (isVisible) {
      wasVisibleRef.current = true;
      setModalVisible(true);
      slideAnim.setValue(600);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (wasVisibleRef.current) {
      wasVisibleRef.current = false;
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }
  }, [isVisible]);

  function handleForgetMemory(memory: Memory) {
    Alert.alert('Forget this?', 'Quietly will no longer remember this.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Forget',
        style: 'destructive',
        onPress: () => onDeleteMemory(memory.id),
      },
    ]);
  }

  function handleClearAll() {
    Alert.alert(
      'Clear everything?',
      "This cannot be undone. Quietly will start fresh and won't remember anything about you.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            onClearAll();
            onClose();
          },
        },
      ],
    );
  }

  function handleSignOut() {
    Alert.alert('Sign out?', 'You can sign back in at any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dark backdrop */}
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        {/* Sliding sheet */}
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            backgroundColor: Colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            maxHeight: '75%',
            paddingBottom: 32,
          }}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.border,
              alignSelf: 'center',
              marginTop: 10,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginTop: 20,
              paddingHorizontal: 20,
            }}
          >
            <View>
              <Text
                style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary }}
              >
                What I Remember
              </Text>
              <Text
                style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}
              >
                These are insights Quietly has learned about you.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 20, color: Colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Memory list */}
          <ScrollView style={{ flex: 1, marginTop: 16 }} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View
                style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}
              >
                <ActivityIndicator color={Colors.accent} />
                <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
                  Loading your memories...
                </Text>
              </View>
            ) : memories.length === 0 ? (
              <View
                style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 }}
              >
                <Text style={{ fontSize: 32 }}>✨</Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: Colors.textPrimary,
                    textAlign: 'center',
                    marginTop: 12,
                  }}
                >
                  No memories yet
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.textSecondary,
                    textAlign: 'center',
                    marginTop: 6,
                    lineHeight: 18,
                  }}
                >
                  Quietly will remember things about you as you chat.
                </Text>
              </View>
            ) : (
              memories.map(memory => (
                <View
                  key={memory.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: Colors.textPrimary,
                        lineHeight: 20,
                      }}
                    >
                      {'•  '}{memory.insight_text}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: Colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {formatRelativeTime(memory.created_at)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleForgetMemory(memory)}
                    style={{
                      marginLeft: 12,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderWidth: 1,
                      borderColor: Colors.danger,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{ fontSize: 12, fontWeight: '500', color: Colors.danger }}
                    >
                      Forget
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          {/* Clear All button */}
          {memories.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={{
                marginHorizontal: 20,
                marginTop: 16,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderWidth: 1,
                borderColor: Colors.danger,
                alignItems: 'center',
              }}
            >
              <Text
                style={{ fontSize: 15, fontWeight: '600', color: Colors.danger }}
              >
                Clear All Memories
              </Text>
            </TouchableOpacity>
          )}

          {/* Sign out */}
          <TouchableOpacity
            onPress={handleSignOut}
            style={{ marginTop: 8, alignItems: 'center', paddingVertical: 10 }}
          >
            <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
              Sign out
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
