import { Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/colors';

type PaymentData = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

interface RazorpayWebViewProps {
  subscriptionId: string;
  keyId: string;
  onSuccess: (paymentData: PaymentData) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

export function RazorpayWebView({
  subscriptionId,
  keyId,
  onSuccess,
  onError,
  onClose,
}: RazorpayWebViewProps) {
  const checkoutUrl =
    `https://quietly.pro/razorpay-checkout` +
    `?key=${keyId}&subscription_id=${subscriptionId}`;

  return (
    <Modal visible transparent={false} animationType="slide" statusBarTranslucent>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.background }}
      >
        {/* Header */}
        <View
          style={{
            height: 52,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.textPrimary,
              flex: 1,
              textAlign: 'center',
            }}
          >
            Complete Payment
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ position: 'absolute', right: 16 }}
          >
            <Text style={{ fontSize: 22, color: Colors.textSecondary }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Razorpay checkout WebView */}
        <WebView
          source={{ uri: checkoutUrl }}
          style={{ flex: 1 }}
          onNavigationStateChange={(navState) => {
            if (!navState.url.includes('payment-success')) return;

            try {
              const url = new URL(navState.url);
              const paymentId = url.searchParams.get('razorpay_payment_id');
              const subId = url.searchParams.get('razorpay_subscription_id');
              const sig = url.searchParams.get('razorpay_signature');

              if (paymentId && subId && sig) {
                onSuccess({
                  razorpay_payment_id: paymentId,
                  razorpay_subscription_id: subId,
                  razorpay_signature: sig,
                });
              } else {
                onError('Missing payment parameters in redirect URL.');
              }
            } catch {
              onError('Failed to parse payment redirect URL.');
            }
          }}
          onError={(e) => onError(e.nativeEvent.description)}
        />
      </SafeAreaView>
    </Modal>
  );
}
