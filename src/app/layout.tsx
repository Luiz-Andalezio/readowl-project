import { Geist, Geist_Mono, PT_Serif } from "next/font/google";
import localFont from "next/font/local";
import Providers from "@/components/ui/Providers";
import Footer from "@/components/sections/Footer";
import NavGate from "@/components/ui/navbar/NavGate";
import "./globals.css";

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

// PT Serif from Google Fonts
const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"]
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
  <body className={`${geistSans.variable} ${geistMono.variable} ${yuseiMagic.variable} ${ptSerif.variable} antialiased`}>
        <Providers>
          <NavGate />
          {children}
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
