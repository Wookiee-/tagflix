import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tagflix.app',
  appName: 'Tagflix',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow all iframe navigations for streaming embeds
    allowNavigation: ['*'],
  },
  android: {
    // Allow mixed content — iframe embeds use http in https context
    allowMixedContent: true,
    // Force landscape for TV/Firestick
    backgroundColor: '#0a0a0f',
  },
};

export default config;
