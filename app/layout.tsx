import type { Metadata } from 'next';
import Particles from '@/components/Particles';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeetCode Streak Guardian | Never Break Your Streak',
  description:
    'Get free Telegram alerts if you miss your daily LeetCode problem. Keep your streak alive!',
  keywords: ['leetcode', 'streak', 'coding', 'reminder', 'daily challenge'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-grid min-h-screen">
        {/* Floating particles background - client component to avoid hydration mismatch */}
        <Particles />

        {/* Main content */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
