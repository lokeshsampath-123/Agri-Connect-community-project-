import { Hanken_Grotesk, Instrument_Serif } from 'next/font/google';
import './globals.css';
import ClientLayoutHelper from './client-layout-helper';

const hankenGrotesk = Hanken_Grotesk({
  variable: '--font-hanken-grotesk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata = {
  title: 'FarmWise | Verdant Intelligence in Agriculture',
  description: 'Bridging traditional farming wisdom with Artificial Intelligence to revolutionize Indian agriculture through real-time scanning, pest alerts, and market analytics.',
  openGraph: {
    title: 'FarmWise | Verdant Intelligence',
    description: 'AI-native agricultural surveillance and diagnostics.',
    type: 'website',
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        {/* Load Material Symbols Outlined */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-full font-body text-on-surface bg-background flex flex-col antialiased">
        {/* Handles cursor, scroll reveals, and Client-side interactions */}
        <ClientLayoutHelper />
        {children}
      </body>
    </html>
  );
}
