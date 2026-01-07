import type { Metadata, Viewport } from "next"
import React from "react"
import { Inter } from "next/font/google"

import { ServiceWorkerRegister } from "@/components/pwa-register"
import "./globals.css"

/* -----------------------------
   Font configuration
------------------------------ */
const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
})

/* -----------------------------
   Metadata (App Router)
------------------------------ */
export const metadata: Metadata = {
  title: "Setu - Aapka Saathi",
  description: "Voice-first PWA for accessing government services in Hindi",
  manifest: "/manifest.json",
  applicationName: "Setu",
  icons: {
    icon: ["/icon-192.png", "/icon-512.png"],
    apple: ["/apple-icon.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Setu",
  },
}

/* -----------------------------
   Viewport
------------------------------ */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1A365D",
}

/* -----------------------------
   Root Layout
------------------------------ */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}

