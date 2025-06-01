import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.interviewprep.app',
  appName: 'AI Interview analysis',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
