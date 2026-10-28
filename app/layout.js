import { Bricolage_Grotesque, Inter } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata = {
  title: 'SneakerDrop - Limited sneaker releases',
  description: 'SneakerDrop is a fictional premium sneaker showcase. Browse the latest drops and join the waitlist for the pairs you want.',
};

export const viewport = { themeColor: '#0a0a0b' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
