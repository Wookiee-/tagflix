import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tagflix.app',
  appName: 'Tagflix',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow iframe embeds in the webview
    allowNavigation: ['*'],
  },
  plugins: {
    // Android-specific settings for TV/Fire Stick
    CapacitorAndroid: {
      allowMixedContent: true,
    },
  },
  android: {
    // Allow mixed content (http iframes in https context)
    allowMixedContent: true,
    // Build for TV
    buildOptions: {
      // Will be set when building for TV specifically
    },
  },
};

export default config;
