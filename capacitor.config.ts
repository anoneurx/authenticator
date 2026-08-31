import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anoneurx.vault',
  appName: 'Authenticator',
  // Static client assets produced by `npm run build`.
  // The app currently builds as SSR, so this folder does not yet contain an
  // index.html. Generate the static SPA shell (see README "Android / Capacitor")
  // before running `npx cap sync android`.
  webDir: '.output/public',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#18181b",
    },
  },
};

export default config;
