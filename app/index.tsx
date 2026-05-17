import { Redirect } from 'expo-router';
import Head from 'expo-router/head';

export default function Index() {
  return (
    <>
      <Head>
        <title>Quietly — Your Private AI Companion</title>
        <meta
          name="description"
          content="Quietly is a private AI companion built for introverts and people with social anxiety. Practice conversations, process your thoughts, and feel heard — without judgment."
        />
        <meta
          name="keywords"
          content="introvert app, social anxiety, AI companion, mental wellness, quiet, private chat"
        />

        {/* OpenGraph */}
        <meta property="og:title" content="Quietly — Your Private AI Companion" />
        <meta
          property="og:description"
          content="A calm AI companion for introverts. Private, judgment-free, always available."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://quietly.pro" />
        <meta property="og:image" content="https://quietly.pro/og-image.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Quietly — Your Private AI Companion" />
        <meta name="twitter:description" content="A calm AI companion for introverts." />

        {/* Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0F1117" />
      </Head>

      <Redirect href="/(tabs)" />
    </>
  );
}
