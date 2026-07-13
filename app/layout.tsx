import type { Metadata } from 'next';
import { IBM_Plex_Mono, Noto_Sans, Rubik, Space_Grotesk } from 'next/font/google';

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

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-landing-sans',
  weight: ['400', '500', '600'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-landing-mono',
  weight: ['400', '500', '600'],
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
      <body
        className={`${spaceGrotesk.variable} ${notoSans.variable} ${rubik.variable} ${ibmPlexMono.variable} bg-background antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
