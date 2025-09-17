import withPWAInit from 'next-pwa';

// Enable PWA only in production by default (recommended)
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV !== 'production',
});

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  // ❗️DO NOT add experimental.appDir here — Next 14 already uses App Router by default
};

export default withPWA(baseConfig);
