import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'MIRA-H — Multimodal Assistive Communication Platform',
  description:
    'Human-centred assistive communication bridging Indian Sign Language (ISL), American Sign Language (ASL), English, and Hindi.',
  authors: [{ name: 'Sharique' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-screen bg-cream text-ink antialiased">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
