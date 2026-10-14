import Constants from 'expo-constants';

// The backend runs on the same laptop as the Expo dev server, so in development its
// address is the one the phone loaded the app from (hostUri, e.g. "10.54.4.131:8081")
// with the backend's port. Changing Wi-Fi network then needs no edit anywhere.
// EXPO_PUBLIC_API_URL in sproutly-mobile/.env (not in Git) overrides it, e.g. for a
// fixed tunnel address; restart Expo after changing .env.
const devHost = Constants.expoConfig?.hostUri?.split(':')[0];

export const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || (devHost ? `http://${devHost}:8000` : 'http://localhost:8000');
