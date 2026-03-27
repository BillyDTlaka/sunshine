import PDFDocument from 'pdfkit'

export class PdfService {
  generateQuotePdf(quote: Record<string, unknown>): Buffer {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ margin: 50 })

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    // Header
    doc.fontSize(20).text('QUOTATION', { align: 'center' })
    doc.moveDown()
    doc.fontSize(10).text(`Quote Reference: ${(quote as any).referenceNumber ?? ''}`)
    doc.text(`Date: ${new Date().toLocaleDateString('en-ZA')}`)
    doc.text(`Valid Until: ${(quote as any).validUntil ?? ''}`)
    doc.moveDown()

    // Client details
    doc.fontSize(12).text('Bill To:', { underline: true })
    doc.fontSize(10).text(`${(quote as any).clientName ?? ''}`)
    doc.moveDown()

    // Line items table header
    doc.fontSize(10).text('Description', 50, doc.y, { width: 200 })
    doc.text('Qty', 260, doc.y - 12, { width: 50 })
    doc.text('Unit Price', 310, doc.y - 12, { width: 80 })
    doc.text('Total', 400, doc.y - 12, { width: 80 })
    doc.moveDown(0.5)
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.5)

    // Line items
    const lines = ((quote as any).lines ?? []) as Array<Record<string, unknown>>
    for (const line of lines) {
      doc.text(String(line.description ?? ''), 50, doc.y, { width: 200 })
      doc.text(String(line.quantity ?? ''), 260, doc.y - 12, { width: 50 })
      doc.text(`R ${Number(line.unitSell ?? 0).toFixed(2)}`, 310, doc.y - 12, { width: 80 })
      doc.text(`R ${Number(line.totalSell ?? 0).toFixed(2)}`, 400, doc.y - 12, { width: 80 })
    }

    doc.moveDown()
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.5)
    doc.fontSize(12).text(`Total: R ${Number((quote as any).totalSell ?? 0).toFixed(2)}`, { align: 'right' })

    doc.end()

    return Buffer.concat(chunks)
  }

  generateInvoicePdf(invoice: Record<string, unknown>): Buffer {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ margin: 50 })

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    doc.fontSize(20).text('TAX INVOICE', { align: 'center' })
    doc.moveDown()
    doc.fontSize(10).text(`Invoice Number: ${(invoice as any).invoiceNumber ?? ''}`)
    doc.text(`Invoice Date: ${(invoice as any).invoiceDate ?? ''}`)
    doc.text(`Due Date: ${(invoice as any).dueDate ?? ''}`)
    doc.text(`PO Reference: ${(invoice as any).poNumber ?? ''}`)
    doc.moveDown()
    doc.fontSize(12).text(`Total Amount: R ${Number((invoice as any).totalAmount ?? 0).toFixed(2)}`, { align: 'right' })

    doc.end()

    return Buffer.concat(chunks)
  }
}
