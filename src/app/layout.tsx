import type { Metadata, Viewport } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { ThemeProvider } from '@/lib/ThemeContext'

export const metadata: Metadata = {
  title: 'زيدان ERP',
  description: 'نظام إدارة الأكاديمية الرياضية',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ThemeProvider>
          <div className="page-shell">
            {/* Sidebar — desktop docked / mobile slide-over drawer */}
            <Sidebar />

            {/* Main content — bottom padding accounts for bottom nav on mobile */}
            <main className="main-content">
              <div className="main-inner">
                {children}
              </div>
            </main>

            {/* Bottom nav — mobile only (hidden ≥ 1024px via CSS) */}
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
