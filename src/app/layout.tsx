import type { Metadata } from 'next';
import { Nunito, Noto_Serif_KR } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

const notoSerifKR = Noto_Serif_KR({
  variable: '--font-noto-kr',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: '한국어 선생님 — Korean Tutor',
  description: 'Lerne Koreanisch mit Minji — Vokabeln, Aussprache und Konversation',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="de" className={`${nunito.variable} ${notoSerifKR.variable}`}>
      <body>{children}</body>
    </html>
  );
}
