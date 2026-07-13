import type { Metadata } from 'next';
import { Noto_Sans, Space_Grotesk } from 'next/font/google';

import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['500', '600', '700'],
});

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Fulling - Dedicated AI Workspaces',
  description: 'The identity and runtime credential foundation for dedicated AI workspaces.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${notoSans.variable} bg-background antialiased`}>
        {children}
      </body>
    </html>
  );
}
