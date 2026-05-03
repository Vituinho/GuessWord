import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
