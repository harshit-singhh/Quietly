import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { usePaywall } from '@/hooks/usePaywall';
import { RazorpayWebView } from '@/components/RazorpayWebView';

const BENEFITS = [
  '🎙️  Voice conversations with AI',
  '🧠  Persistent memory across sessions',
  '🔓  Unlimited chat sessions',
  '🧘  Panic circuit-breaker tool',
  '💬  Social situation simulator',
  '✨  Priority support',
];

interface PaywallModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  featureName?: string;
}

export function PaywallModal({
  isVisible,
  onClose,
  onSuccess,
  featureName,
}: PaywallModalProps) {
  const {
    isIndianUser,
    price,
    isLoading,
    error,
    isSuccess,
    razorpayCheckoutData,
    subscribe,
    verifyAndActivate,
  } = usePaywall();

  const [modalVisible, setModalVisible] = useState(false);
  const [showRazorpayWebView, setShowRazorpayWebView] = useState(false);
  const slideAnim = useRef(new Animated.Value(800)).current;
  const wasVisibleRef = useRef(false);

  // Slide-up / slide-down animation
  useEffect(() => {
    if (isVisible) {
      wasVisibleRef.current = true;
      setModalVisible(true);
      slideAnim.setValue(800);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (wasVisibleRef.current) {
      wasVisibleRef.current = false;
      Animated.timing(slideAnim, {
        toValue: 800,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }
  }, [isVisible]);

  // When Razorpay checkout data arrives, open the WebView
  useEffect(() => {
    if (razorpayCheckoutData) {
      setShowRazorpayWebView(true);
    }
  }, [razorpayCheckoutData]);

  // Auto-close 1.5s after successful activation
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      onSuccess();
      onClose();
    }, 1500);
    return () => clearTimeout(timer);
  }, [isSuccess]);

  const priceDisplay = isIndianUser ? '₹149' : '$5.99';
  const locationNote = isIndianUser ? '🇮🇳 India pricing' : '🌍 International pricing';

  return (
    <>
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />

          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
              backgroundColor: Colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderTopColor: Colors.border,
              paddingBottom: 40,
              maxHeight: '90%',
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

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Lock + title */}
              <Text style={{ fontSize: 40, textAlign: 'center', marginTop: 20 }}>
                🔒
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: Colors.textPrimary,
                  textAlign: 'center',
                  marginTop: 12,
                  paddingHorizontal: 20,
                }}
              >
                {featureName ? `Unlock ${featureName}` : 'Unlock Quietly Premium'}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 4,
                  paddingHorizontal: 20,
                }}
              >
                Everything Quietly can offer, unlocked.
              </Text>

              {/* Price card */}
              <View
                style={{
                  marginTop: 20,
                  marginHorizontal: 20,
                  backgroundColor: '#1E1B4B',
                  borderWidth: 1.5,
                  borderColor: Colors.accent,
                  borderRadius: 16,
                  padding: 20,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 48,
                    fontWeight: '800',
                    color: Colors.textPrimary,
                  }}
                >
                  {priceDisplay}
                </Text>
                <Text
                  style={{ fontSize: 16, color: Colors.textSecondary, marginTop: 2 }}
                >
                  per month
                </Text>
                <Text
                  style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 8 }}
                >
                  {locationNote}
                </Text>
                <Text
                  style={{ fontSize: 13, color: Colors.accent, marginTop: 4 }}
                >
                  Cancel anytime. No questions asked.
                </Text>
              </View>

              {/* Benefits */}
              <View style={{ marginTop: 20, marginHorizontal: 20 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.textSecondary,
                    marginBottom: 12,
                  }}
                >
                  What you get:
                </Text>
                {BENEFITS.map((benefit, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: 'rgba(79,70,229,0.2)',
                        borderWidth: 1,
                        borderColor: Colors.accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: Colors.accent,
                          lineHeight: 14,
                        }}
                      >
                        ✓
                      </Text>
                    </View>
                    <Text
                      style={{
                        marginLeft: 10,
                        fontSize: 15,
                        color: Colors.textPrimary,
                        flex: 1,
                      }}
                    >
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Error */}
              {!!error && (
                <View
                  style={{
                    marginHorizontal: 20,
                    marginTop: 12,
                    backgroundColor: '#2D1515',
                    borderWidth: 1,
                    borderColor: Colors.danger,
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, color: Colors.danger }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Subscribe button */}
              <TouchableOpacity
                disabled={isLoading || isSuccess}
                onPress={subscribe}
                style={{
                  marginTop: 20,
                  marginHorizontal: 20,
                  height: 56,
                  backgroundColor: isSuccess ? Colors.success : Colors.accent,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: isLoading ? 0.8 : 1,
                }}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="white" />
                    <Text style={{ color: 'white', fontSize: 16 }}>
                      {' '}Processing...
                    </Text>
                  </>
                ) : isSuccess ? (
                  <Text
                    style={{ color: 'white', fontSize: 17, fontWeight: '700' }}
                  >
                    ✓ Premium Activated!
                  </Text>
                ) : (
                  <Text
                    style={{ color: 'white', fontSize: 17, fontWeight: '700' }}
                  >
                    Subscribe — {price}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Terms */}
              <Text
                style={{
                  fontSize: 11,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 8,
                  paddingHorizontal: 20,
                  paddingBottom: 8,
                }}
              >
                By subscribing you agree to our Terms of Service
              </Text>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Razorpay WebView — shown when checkout data is ready */}
      {showRazorpayWebView && razorpayCheckoutData && (
        <RazorpayWebView
          subscriptionId={razorpayCheckoutData.subscriptionId}
          keyId={razorpayCheckoutData.keyId}
          onSuccess={async (paymentData) => {
            setShowRazorpayWebView(false);
            await verifyAndActivate({
              provider: 'razorpay',
              razorpayPaymentId: paymentData.razorpay_payment_id,
              razorpaySubscriptionId: paymentData.razorpay_subscription_id,
              razorpaySignature: paymentData.razorpay_signature,
            });
          }}
          onError={(message) => {
            setShowRazorpayWebView(false);
          }}
          onClose={() => setShowRazorpayWebView(false)}
        />
      )}
    </>
  );
}
