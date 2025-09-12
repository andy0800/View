import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.viewonline.app',
  appName: 'View',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: 'transparent',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'default',
      backgroundColor: 'transparent',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    App: {
      launchUrl: 'https://viewonline.me/',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: 'View-Mobile-App',
    overrideUserAgent: 'View Mobile App',
    backgroundColor: 'transparent',
    allowNavigation: ['https://viewonline.me/*', 'https://viewapp-backend.onrender.com/*'],
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: 'transparent',
    scheme: 'View',
    allowsLinkPreview: false,
    handleApplicationNotifications: true,
  },
};

export default config;
