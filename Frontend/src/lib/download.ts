/** Triggers a browser download of `content` as a plain-text file named `filename`. */
export function downloadTextFile(filename: string, content: string): void {
  downloadBlob(filename, new Blob([content], { type: "text/plain;charset=utf-8;" }))
}

/** Triggers a browser download of a file the app already has (e.g. a PDF from the API). */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
