import type { Metadata } from "next";
import { LocalModeProvider } from "@/store/LocalModeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuessWord",
  description: "Treino moderno de vocabulario em ingles com login, ranking e multiplayer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <LocalModeProvider>{children}</LocalModeProvider>
      </body>
    </html>
  );
}

