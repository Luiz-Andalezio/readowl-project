import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Footer from '@/components/sections/Footer';
import Providers from "@/components/ui/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Local Yusei Magic font (placed in public/fonts/yusei-magic)
const yuseiMagic = localFont({
  src: [
    { path: "../../public/fonts/yusei-magic/YuseiMagic-Regular.ttf", weight: "400", style: "normal" }
  ],
  variable: "--font-yusei-magic",
  display: "swap"
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <head>
        <link rel="icon" href="/icon.png" />
      </head>
  <body className={`${geistSans.variable} ${geistMono.variable} ${yuseiMagic.variable} antialiased`}>        
        <Providers>
          {children}
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
