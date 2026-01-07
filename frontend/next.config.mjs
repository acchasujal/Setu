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
  register: false,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
}

export default withPwa(nextConfig)
