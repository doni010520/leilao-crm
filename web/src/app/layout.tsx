import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LeilãoCRM — CRM + IA para Imobiliárias de Leilão",
  description: "Pipeline de leads, base de imóveis, agente de IA no WhatsApp e muito mais.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`h-full antialiased ${display.variable} ${body.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
