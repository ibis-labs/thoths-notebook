import type { Metadata, Viewport } from 'next';
import { Quantico, Orbitron } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { PtahManager } from '@/components/ptah-manager';
import { OathGate } from '@/components/oath-gate';
import { PwaInstallPrompt } from '@/pwa-install-prompt';

// 1. Summon the fonts (Google Font Optimization)
const quantico = Quantico({ 
  weight: ['400', '700'], 
  subsets: ['latin'],
  variable: '--font-quantico', 
});

const orbitron = Orbitron({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-orbitron',
});

// 2. Metadata & Viewport remain separate constants
export const metadata: Metadata = {
  title: "Thoth's Notebook",
  description: 'Manage your tasks with the wisdom of the ancients.',
  manifest: '/manifest.json',
  authors: [
    { name: 'Pete Blunk', url: 'https://unclepetelaboratories.net' },
    { name: 'GitHub Profile', url: 'https://github.com/peteblunk' },
  ],
  icons: {
    icon: '/icons/thoth-icon.svg',
    apple: '/icons/thoth-icon-180.png',
  },
};

export const viewport: Viewport = {
  themeColor: "#000000", // Adjusted to match your Absolute Void
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
};

// 3. THE SINGLE MASTER LAYOUT
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${quantico.variable} ${orbitron.variable} font-body antialiased bg-black text-foreground`}>
        <AuthProvider>
          <PtahManager />
          <OathGate />
          <PwaInstallPrompt />
          <SidebarProvider>
            {children}
           
          </SidebarProvider>
           <PwaInstallPrompt />
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}