import type { Metadata } from "next";
import { Nunito, PT_Sans } from "next/font/google";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";
import { TailwindIndicator } from "@/components/devtools/tailwind-indicator";
import TRPCProvider from "@/components/providers/trpc";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/env";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const ptSans = PT_Sans({
  variable: "--font-pt-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const ogTitle = "Bugdet.co";
const ogDescription = "Your financial state, with the ease of AI.";

export const metadata: Metadata = {
  title: {
    template: "%s @ Bugdet.co",
    default: ogTitle,
  },
  description: ogDescription,
  openGraph: {
    url: env.NEXT_PUBLIC_APP_URL,
    type: "website",
    siteName: "Bugdet.co",
    title: ogTitle,
    description: ogDescription,
    locale: "en_US",
    images: [],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
    images: [],
  },
  icons: {
    // Standard favicons
    icon: [
      { url: "/images/favicon.ico", sizes: "any" },
      { url: "/images/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    // Apple Touch Icon
    apple: [
      {
        url: "/images/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    // Android Chrome icons
    other: [
      {
        url: "/images/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/images/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${ptSans.variable} relative antialiased`}
      >
        <div className="texture" />
        <TRPCProvider>
          <NuqsAdapter>
            <main>{children}</main>
            <Toaster />
            <TailwindIndicator />
          </NuqsAdapter>
        </TRPCProvider>
      </body>
    </html>
  );
}
