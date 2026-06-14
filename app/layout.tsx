import type { Metadata } from "next";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";

import "./globals.css";

// Vazirmatn for Persian/Arabic text - self-hosted by Next.js
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-vazirmatn",
  display: "swap",
});

// Geist Sans for English text - self-hosted by Next.js
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Geist Mono for code - self-hosted by Next.js
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "پرامپتِک – هوش تجاری فقط با یک پرامپت فارسی",
  description: "به فارسی پرامپت بزنید → در کمتر از ۱ ثانیه SQL + داشبورد هوشمند تحویل بگیرید",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" className={`${vazirmatn.variable} ${geistSans.variable} ${geistMono.variable} scroll-smooth`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
