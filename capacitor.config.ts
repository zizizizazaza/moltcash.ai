import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lokacash.app',
  appName: 'Loka Cash',
  webDir: 'dist',
  server: {
    // Use the remote API in production builds
    // For local dev, you can override this with a live-reload URL
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#FFFFFF',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
    },
  },
};

export default config;
