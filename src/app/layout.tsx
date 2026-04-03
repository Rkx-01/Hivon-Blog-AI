import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import NavigationReset from '@/components/NavigationReset';
import { Suspense } from 'react';
import { GradientBarsBackground } from '@/components/ui/gradient-bars-background';

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
          <NavigationReset />
          <Navbar />
          <GradientBarsBackground
            numBars={15}
            gradientFrom="rgba(245, 158, 11, 0.4)"
            gradientTo="rgba(245, 158, 11, 0)"
            animationDuration={3}
            backgroundColor="var(--bg-primary)"
          />
          <main style={{ position: 'relative', zIndex: 10, background: 'transparent', minHeight: 'calc(100vh - 150px)' }}>{children}</main>
          <footer className="global-footer">
            Hivon Blogs © 2026 · Powered by Gemini AI
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
