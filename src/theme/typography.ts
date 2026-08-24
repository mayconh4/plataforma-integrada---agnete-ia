import { Platform } from 'react-native';

/** Monospace family, matching the terminal aesthetic across platforms. */
export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
}) as string;
