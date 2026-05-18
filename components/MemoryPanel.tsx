import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
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
}

function formatMemoryDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function MemoryPanel({
  isVisible,
  memories,
  isLoading,
  onDeleteMemory,
  onClearAll,
  onClose,
}: MemoryPanelProps) {
  function handleClearAll() {
    if (memories.length === 0) return;
    Alert.alert(
      'Clear all memories?',
      'Quietly will no longer remember anything about you. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: onClearAll },
      ],
    );
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide" statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        <SafeAreaView
          style={{
            backgroundColor: Colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '75%',
            borderTopWidth: 1,
            borderColor: Colors.border,
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.border,
              alignSelf: 'center',
              marginTop: 12,
              marginBottom: 4,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            }}
          >
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary }}>
                What I remember
              </Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
                {memories.length} insight{memories.length !== 1 ? 's' : ''} · stored privately
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 24, color: Colors.textSecondary }}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Memory list */}
          {isLoading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Text style={{ color: Colors.textSecondary }}>Loading memories…</Text>
            </View>
          ) : memories.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center', paddingHorizontal: 24 }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>🧠</Text>
              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 15,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                No memories yet.{'\n'}Quietly will learn about you as you chat.
              </Text>
            </View>
          ) : (
            <FlatList
              data={memories}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: Colors.background,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                  }}
                >
                  <Text style={{ fontSize: 14, color: Colors.textSecondary, marginRight: 6 }}>
                    ·
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: Colors.textPrimary, lineHeight: 20 }}>
                      {item.insight_text}
                    </Text>
                    <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4 }}>
                      {formatMemoryDate(item.created_at)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onDeleteMemory(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ marginLeft: 10, paddingTop: 2 }}
                  >
                    <Text style={{ fontSize: 16, color: Colors.textSecondary }}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          {/* Clear all button */}
          {memories.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={{
                marginHorizontal: 20,
                marginBottom: 12,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#EF4444',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>
                Clear all memories
              </Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
