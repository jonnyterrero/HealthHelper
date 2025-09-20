import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import SwRegister from "@/components/pwa/sw-register";

export const metadata: Metadata = {
  title: "Orchids Health Tracker",
  description: "Track stomach, skin, and mental health with insights and exports.",
  applicationName: "Orchids Health Tracker",
  manifest: "/manifest.webmanifest",
  themeColor: "#a855f7",
  // Apple specific install experience
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Orchids",
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
    // Add apple-touch-icon (iOS homescreen)
    apple: [
      {
        url:
          "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/2c387a36-22e8-4090-af90-b8a7e04d1517/generated_images/apple-touch-icon-for-ios-homescreen.-min-76569025-20250920041137.jpg",
        sizes: "180x180",
      },
    ],
    // Safari pinned tab mask icon (uses monochrome SVG)
    other: [
      { rel: "mask-icon", url: "/next.svg", color: "#a855f7" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {children}
        <SwRegister />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}