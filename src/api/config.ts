import { Platform } from 'react-native';

/** Base URL of plural-api for the current platform. */
export function getApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  const url = configured ? configured : Platform.OS === 'android' ? 'http://10.0.2.2:4100' : 'http://localhost:4100';
  return url.replace(/\/$/, '');
}
