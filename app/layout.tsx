import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // for iPhone notch / dynamic island safe areas
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: "OfficeHub",
  applicationName: "OfficeHub",
  description: "OfficeHub - Modern Office Management",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OfficeHub",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="h-full overflow-hidden">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
