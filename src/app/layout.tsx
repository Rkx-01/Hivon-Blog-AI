import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Hivon Blogs — AI-Powered Blogging Platform',
  description: 'A modern blogging platform with AI-generated summaries, role-based access, and a beautiful reading experience.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <footer className="global-footer">
            Hivon Blogs © 2026 · Powered by Gemini AI
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
