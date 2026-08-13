import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ramais - New Life",
  description: "Lista de ramais internos e externos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="page-wrapper">
          {children}
          <footer className="global-footer">
            <div style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>
              desenvolvido por Valdeir - (NOC - Centro de Operações de rede)
            </div>
            © 2026 New Life Fibra. Todos os direitos reservados.
          </footer>
        </div>
      </body>
    </html>
  );
}
