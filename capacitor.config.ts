import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anoneurx.vault',
  appName: 'Anoneurx Authenticator',
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
};

export default config;
