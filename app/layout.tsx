import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Curation Toolkit",
  description: "Ferramenta de curação de conteúdo educacional com otimização por IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="light" storageKey="ai-curation-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
