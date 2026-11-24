/**
 * export.ts — Zero-dependency export utilities
 *
 * PDF  → window.print() with a dedicated print stylesheet injected at runtime.
 *         The caller passes an HTML string; we open a hidden iframe, inject it,
 *         and trigger print — no popup blocker, no new tab.
 *
 * CSV  → RFC-4180 compliant CSV with UTF-8 BOM so Arabic shows correctly in Excel.
 *         Cells are quoted and internal quotes are escaped.
 */

// ─────────────────────────────────────────────────────────────
// CSV
// ─────────────────────────────────────────────────────────────

type CsvRow = (string | number | null | undefined)[]

/** Escape a single cell value per RFC-4180 */
function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '""'
  const s = String(v)
  // Quote everything — safest for Arabic, numbers, dates
  return '"' + s.replace(/"/g, '""') + '"'
}

export interface CsvSheet {
  /** Sheet / file name (no extension) */
  name: string
  headers: string[]
  rows: CsvRow[]
}

/**
 * Download one or more sheets as a single CSV file.
 * Multiple sheets are separated by an empty line and a sheet-name header.
 */
export function downloadCSV(sheets: CsvSheet[], filename: string): void {
  // UTF-8 BOM — makes Excel recognise Arabic correctly
  const BOM = '\uFEFF'

  const lines: string[] = []

  sheets.forEach((sheet, i) => {
    if (i > 0) lines.push('', '')          // blank separator between sheets
    if (sheets.length > 1) {
      lines.push(`"${sheet.name}"`)         // sheet label row
    }
    lines.push(sheet.headers.map(csvCell).join(','))
    sheet.rows.forEach(row => {
      lines.push(row.map(csvCell).join(','))
    })
  })

  const csv  = BOM + lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${filename}.csv`)
}

// ─────────────────────────────────────────────────────────────
// PDF via print
// ─────────────────────────────────────────────────────────────

export interface PdfOptions {
  /** Arabic title shown at the top of the printed page */
  title: string
  /** Sub-heading (e.g. month / year) */
  subtitle?: string
  /** HTML body content — tables, paragraphs, etc. */
  body: string
  /** Direction: defaults to rtl */
  dir?: 'rtl' | 'ltr'
}

const PRINT_CSS = `
  @page { size: A4; margin: 18mm 14mm; }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    font-size: 11pt;
    color: #111;
    background: #fff;
    direction: rtl;
  }

  .pdf-header {
    border-bottom: 2.5pt solid #0014bd;
    padding-bottom: 8pt;
    margin-bottom: 16pt;
  }

  .pdf-header h1 {
    font-size: 18pt;
    font-weight: 900;
    color: #0014bd;
    letter-spacing: -0.02em;
  }

  .pdf-header p {
    font-size: 9pt;
    color: #666;
    margin-top: 3pt;
  }

  .pdf-section {
    margin-bottom: 18pt;
  }

  .pdf-section-title {
    font-size: 10pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #0014bd;
    border-bottom: 1pt solid #dde;
    padding-bottom: 3pt;
    margin-bottom: 8pt;
  }

  /* KPI grid */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8pt;
    margin-bottom: 10pt;
  }

  .kpi-card {
    border: 1pt solid #dde;
    border-radius: 6pt;
    padding: 7pt 9pt;
  }

  .kpi-label {
    font-size: 7.5pt;
    color: #666;
    margin-bottom: 3pt;
  }

  .kpi-value {
    font-size: 14pt;
    font-weight: 900;
    color: #0014bd;
    font-variant-numeric: tabular-nums;
  }

  .kpi-sub {
    font-size: 7pt;
    color: #888;
    margin-top: 2pt;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    margin-top: 4pt;
  }

  thead tr {
    background-color: #0014bd;
    color: #fff;
  }

  thead th {
    padding: 5pt 7pt;
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
  }

  tbody tr:nth-child(even) { background-color: #f4f6ff; }

  tbody td {
    padding: 4.5pt 7pt;
    border-bottom: 0.5pt solid #e5e7f0;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .amount { font-weight: 700; color: #0014bd; }

  .total-row td {
    font-weight: 900;
    background-color: #0014bd !important;
    color: #fff;
  }

  .profit-positive { color: #007a2e; font-weight: 900; }
  .profit-negative { color: #c0392b; font-weight: 900; }

  /* formula strip */
  .formula-box {
    border: 1.5pt solid #0014bd;
    border-radius: 6pt;
    padding: 8pt 10pt;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8pt;
  }

  .formula-box .label { font-size: 10pt; font-weight: 700; }
  .formula-box .value { font-size: 13pt; font-weight: 900; color: #0014bd; font-variant-numeric: tabular-nums; }

  .footer-line {
    margin-top: 20pt;
    padding-top: 6pt;
    border-top: 1pt solid #dde;
    font-size: 7.5pt;
    color: #aaa;
    display: flex;
    justify-content: space-between;
  }
`

/**
 * Open a hidden iframe, inject the HTML, and trigger the browser's
 * native print dialog. The iframe is removed after printing.
 */
export function printPDF(opts: PdfOptions): void {
  const dir  = opts.dir ?? 'rtl'
  const html = `<!DOCTYPE html>
<html lang="ar" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>${opts.title}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <div class="pdf-header">
    <h1>${opts.title}</h1>
    ${opts.subtitle ? `<p>${opts.subtitle}</p>` : ''}
  </div>
  ${opts.body}
  <div class="footer-line">
    <span>زيدان ERP — نظام الإدارة المتكامل</span>
    <span>${new Date().toLocaleDateString('ar-EG')}</span>
  </div>
</body>
</html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument!
  doc.open()
  doc.write(html)
  doc.close()

  // Small delay so images / fonts load; then print
  setTimeout(() => {
    iframe.contentWindow!.focus()
    iframe.contentWindow!.print()
    // Remove after print dialog closes (delayed to avoid race)
    setTimeout(() => document.body.removeChild(iframe), 2000)
  }, 350)
}

// ─────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Format a number as Arabic currency string (no symbol) */
export function fmt(n: number): string {
  return n.toLocaleString('ar-EG')
}

/** Format a date string to ar-EG locale */
export function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('ar-EG')
}
