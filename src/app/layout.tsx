import React from "react";
import { Metadata } from "next";

// Import global CSS
import "./globals.css";

// Import the client component that will handle the actual layout
import RootLayoutClient from "./RootLayoutClient";

// Define metadata in the server component (outside of "use client")
export const metadata: Metadata = {
  title: "Gandall Group Healthcare Platform",
  description: "Comprehensive healthcare platform for Sub-Saharan Africa with offline-first capabilities",
  icons: {
    icon: "/assets/brand/favicon.png",
    apple: "/assets/brand/logo192.png",
  },
  manifest: "/manifest.json",
};

// Define viewport metadata
export const viewport = {
  themeColor: "#2A8A8E",
  width: "device-width",
  initialScale: 1,
};

// This is a server component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
