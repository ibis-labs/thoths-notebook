import type { Metadata, Viewport } from 'next';
import { Quantico, Orbitron, Jura } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { GlobalBanners } from '@/components/global-banners';
import { OathGate } from '@/components/oath-gate';
import { ArchiveUnlockGate } from '@/components/archive-unlock-gate';
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

// Jura — geometric / futuristic, full Greek subset (for DecryptionHeader Greek phase)
const jura = Jura({
  weight: ['400', '700'],
  subsets: ['greek', 'latin'],
  variable: '--font-jura',
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
      <body className={`${quantico.variable} ${orbitron.variable} ${jura.variable} font-body antialiased bg-black text-foreground`}>
        <AuthProvider>
          <GlobalBanners />
          <ArchiveUnlockGate />
          <OathGate />
          <SidebarProvider>
            {children}
           
          </SidebarProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}