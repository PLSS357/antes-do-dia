import './globals.css';
import './terminal.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Antes do dia — caderno recuperado', description: 'Há coisas que só sobrevivem porque alguém as escreveu.', robots: { index: false, follow: false } };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
