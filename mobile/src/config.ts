import Constants from 'expo-constants';

/** API + socket URLs. EXPO_PUBLIC_* env vars win; otherwise fall back to the
 *  values baked into app.json `extra` (the live prod backend), so the app
 *  works the moment it's opened in Expo Go — no config needed. */
const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string; socketUrl?: string };

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'https://sed-erp.onrender.com/api/v1';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? extra.socketUrl ?? 'https://sed-erp.onrender.com';
