import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, Noto_Sans_Hebrew } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  weight: ['400'],
  subsets: ["latin"],
  variable: '--font-dm-serif',
  display: 'swap',
});

const notoHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  variable: '--font-noto-hebrew',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Rambam System Dashboard | Museum of Tolerance Jerusalem",
  description: "AI Holographic Experience Analytics - Museum of Tolerance Jerusalem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} ${dmSerif.variable} ${notoHebrew.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
