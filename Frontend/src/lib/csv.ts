type CsvCell = string | number

function escapeCell(value: CsvCell): string {
  const s = String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(headers: string[], rows: CsvCell[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n")
}

/**
 * Builds a CSV from `headers` + `rows` and triggers a browser download.
 * Prefix a BOM so Excel opens ₹ and other non-ASCII characters correctly.
 */
export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]): void {
  const csv = "﻿" + toCsv(headers, rows)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
