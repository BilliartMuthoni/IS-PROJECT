// Your computer's LAN IP, not localhost -- the phone is a separate device
// on the network and can't resolve "localhost" to your machine.
// Set it in sproutly-mobile/.env (not in Git) so a new Wi-Fi network needs no code change:
//   EXPO_PUBLIC_API_URL=http://<IPv4 address from `ipconfig`>:8000
// Restart Expo after changing .env.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.15:8000";
