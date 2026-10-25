import type { ConfigContext, ExpoConfig } from 'expo/config';

// app.json holds the shared settings; this file only changes what differs per
// build variant. APP_VARIANT is set by the EAS build profiles (see eas.json).
const isDevelopment = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Plural',
  slug: config.slug ?? 'plural',
  ios: {
    ...config.ios,
    // The .dev suffix lets a development build and a release build sit side by side on one device.
    bundleIdentifier: isDevelopment ? 'social.plural.app.dev' : config.ios?.bundleIdentifier,
    infoPlist: {
      ...config.ios?.infoPlist,
      // Development builds talk to an API on the local network over plain HTTP. Release builds never do.
      ...(isDevelopment ? { NSAppTransportSecurity: { NSAllowsLocalNetworking: true } } : {}),
    },
  },
  android: {
    ...config.android,
    package: isDevelopment ? 'social.plural.app.dev' : config.android?.package,
  },
  plugins: [
    ...(config.plugins ?? []),
    ['expo-build-properties', { android: { usesCleartextTraffic: isDevelopment } }],
  ],
});
