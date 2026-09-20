import type { Metadata } from "next";
import { Inter, Playfair_Display, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthRedirectHandler } from "@/components/AuthRedirectHandler";
import { cn } from "@/lib/utils";

const nunitoSans = Nunito_Sans({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://serenaraga.fit'),
  title: "SerenaRaga - Pijat Panggilan Jogja & Home Massage Nyaman",
  description: "Layanan pijat panggilan ke rumah di Yogyakarta, Bantul, dan Sleman. Hadirkan ketenangan dan kenyamanan pijat personal profesional langsung ke tempat Anda.",
  keywords: ["pijat panggilan jogja", "pijat bantul", "pijat sleman", "home massage yogyakarta", "massage panggilan bantul", "massage bantul", "pijat panggilan ke rumah", "pijat personal jogja", "pijat refleksi yogyakarta"],
  openGraph: {
    title: "SerenaRaga - Home Massage Nyaman di Jogja",
    description: "Layanan pijat panggilan privat di wilayah Yogyakarta, Sleman, Bantul, dan sekitarnya.",
    url: "https://serenaraga.fit",
    siteName: "SerenaRaga",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth" className={cn("font-sans", nunitoSans.variable)}>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthRedirectHandler />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
