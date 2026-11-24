'use client'
import { useState } from 'react'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'
import type { CsvSheet, PdfOptions } from '@/lib/export'

interface ExportButtonsProps {
  /** Called when user clicks CSV — return the sheets to download */
  onCSV: () => { sheets: CsvSheet[]; filename: string }
  /** Called when user clicks PDF — return print options */
  onPDF: () => PdfOptions
  /** Label suffix shown in tooltip / button (e.g. "التقرير الشهري") */
  label?: string
}

export default function ExportButtons({ onCSV, onPDF, label }: ExportButtonsProps) {
  const [busy, setBusy] = useState<'csv' | 'pdf' | null>(null)

  async function handleCSV() {
    setBusy('csv')
    try {
      const { downloadCSV } = await import('@/lib/export')
      const { sheets, filename } = onCSV()
      downloadCSV(sheets, filename)
    } finally {
      setBusy(null)
    }
  }

  async function handlePDF() {
    setBusy('pdf')
    try {
      const { printPDF } = await import('@/lib/export')
      const opts = onPDF()
      printPDF(opts)
    } finally {
      // give print dialog time to open before re-enabling
      setTimeout(() => setBusy(null), 600)
    }
  }

  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.45rem 0.875rem', borderRadius: '9px',
    fontSize: '0.8rem', fontWeight: 700,
    border: '1.5px solid var(--border-strong)',
    cursor: 'pointer', minHeight: '36px', whiteSpace: 'nowrap',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
    transition: 'background-color 0.12s, color 0.12s, border-color 0.12s',
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      {/* CSV / Excel */}
      <button
        onClick={handleCSV}
        disabled={busy !== null}
        title={`تصدير ${label ?? ''} إلى Excel / CSV`}
        style={{ ...base, opacity: busy === 'csv' ? 0.55 : 1 }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--text-on-volt)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-surface)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'
        }}
      >
        <FileSpreadsheet size={14} strokeWidth={2} />
        {busy === 'csv' ? '...' : 'Excel'}
      </button>

      {/* PDF */}
      <button
        onClick={handlePDF}
        disabled={busy !== null}
        title={`طباعة / حفظ ${label ?? ''} كـ PDF`}
        style={{ ...base, opacity: busy === 'pdf' ? 0.55 : 1 }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--text-on-volt)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-surface)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'
        }}
      >
        <Printer size={14} strokeWidth={2} />
        {busy === 'pdf' ? '...' : 'PDF'}
      </button>
    </div>
  )
}
