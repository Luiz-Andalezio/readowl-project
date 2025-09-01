import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from '@/components/Footer';
import Providers from "@/components/ui/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>        
        <Providers>
          {children}
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
