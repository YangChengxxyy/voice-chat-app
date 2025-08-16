import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VoiceChat Mini - 实时语音聊天",
  description:
    "基于WebRTC技术的高质量实时语音聊天应用，支持最多4人同时在线，无需下载任何软件。",
  keywords: ["语音聊天", "WebRTC", "实时通信", "在线聊天", "语音通话"],
  authors: [{ name: "VoiceChat Mini Team" }],

  robots: "index, follow",
  openGraph: {
    title: "VoiceChat Mini - 实时语音聊天",
    description: "基于WebRTC技术的高质量实时语音聊天应用",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "VoiceChat Mini - 实时语音聊天",
    description: "基于WebRTC技术的高质量实时语音聊天应用",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VoiceChat Mini" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <div id="app-root">{children}</div>
        <div id="modal-root" />
      </body>
    </html>
  );
}
