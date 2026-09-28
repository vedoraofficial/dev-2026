/** jsPDF only supports the base WinAnsi font encoding, so swap in ASCII-safe equivalents. */
function pdfSafe(text: string): string {
  return text.replace(/₹/g, "Rs. ").replace(/[–—]/g, "-").replace(/·/g, "-")
}

/** Renders a title + paragraphs as a simple multi-page PDF and triggers a browser download.
 * jsPDF is loaded on demand so its bundle only costs something when a policy is actually downloaded. */
export async function downloadPolicyPdf(
  filename: string,
  title: string,
  paragraphs: string[],
): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const margin = 56
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const maxWidth = pageWidth - margin * 2
  let y = margin

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(pdfSafe(title), margin, y)
  y += 28

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  for (const paragraph of paragraphs) {
    const lines: string[] = doc.splitTextToSize(pdfSafe(paragraph), maxWidth)
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 16
    }
    y += 12
  }

  doc.save(filename)
}
