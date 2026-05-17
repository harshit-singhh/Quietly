import { Redirect } from 'expo-router';

/**
 * Public entry point — immediately redirects to the auth gate.
 * The root _layout.tsx decides whether to send the user to
 * (auth)/login or (tabs) based on session state.
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
