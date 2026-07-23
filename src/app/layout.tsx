import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'STOKED — by Accrion',
  description: 'Private investing circles for serious retail investors. A product of Accrion.',
  applicationName: 'STOKED',
  authors: [{ name: 'Accrion' }],
  publisher: 'Accrion',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'STOKED' },
  // favicon.ico and apple-icon.png in src/app are picked up automatically.
  openGraph: {
    title: 'STOKED',
    description: 'Private investing circles for serious retail investors. A product of Accrion.',
    siteName: 'STOKED by Accrion',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#08090C',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Satoshi:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  )
}
