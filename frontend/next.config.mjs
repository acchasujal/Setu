import withPWA from "next-pwa"
import runtimeCaching from "next-pwa/cache.js"

const isDev = process.env.NODE_ENV === "development"

const withPwa = withPWA({
  dest: "public",
  disable: isDev,
  scope: "/",
  sw: "sw.js",
  cacheStartUrl: true,
  reloadOnOnline: false,
  runtimeCaching,
  // Changed register to true to ensure PWA works on mobile without extra manual code
  register: true, 
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allows loading images/audio from your local backend during development
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/static/**',
      },
    ],
    // Essential if you are using simple <img> or <audio> tags for local dev
    unoptimized: true, 
  },
  turbopack: {},
}

export default withPwa(nextConfig)
