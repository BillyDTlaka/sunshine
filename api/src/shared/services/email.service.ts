import nodemailer from 'nodemailer'
import { config } from '../../config'

export class EmailService {
  private transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  } as any)

  async sendSupplierRequest(params: {
    to: string
    supplierName: string
    projectId: string
    projectTitle: string
    referenceNumber: string
    campus?: string
    department?: string
    deadline?: string
    notes?: string
    lineItems: Array<{ lineNumber: number; description: string; qty: number; unit: string; notes?: string | null }>
    labourRequired: boolean
    labourScope?: string | null
    contactName: string
    contactEmail: string
  }) {
    const rows = params.lineItems.map((li, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'};">
        <td style="padding:8px 12px;color:#999;font-size:13px;width:32px;">${li.lineNumber}</td>
        <td style="padding:8px 12px;font-size:14px;">${li.description}</td>
        <td style="padding:8px 12px;font-size:14px;text-align:right;width:60px;">${Number(li.qty).toLocaleString()}</td>
        <td style="padding:8px 12px;font-size:14px;color:#666;width:60px;">${li.unit}</td>
        <td style="padding:8px 12px;font-size:13px;color:#999;">${li.notes ?? ''}</td>
      </tr>`).join('')

    const metaRows = [
      ['Reference', `<strong style="color:#8B3A3A">${params.referenceNumber}</strong>`],
      ['Project', params.projectTitle],
      params.campus ? ['Site / Campus', params.campus] : null,
      params.department ? ['Department', params.department] : null,
      params.deadline ? ['Quote Deadline', `<strong style="color:#c0392b">${params.deadline}</strong>`] : null,
    ].filter(Boolean).map(([label, value]) =>
      `<tr><td style="padding:8px 16px;color:#888;font-size:13px;width:140px;white-space:nowrap;">${label}</td><td style="padding:8px 16px;font-size:14px;">${value}</td></tr>`
    ).join('')

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;max-width:700px;margin:0 auto;padding:0;">
      <div style="background:#8B3A3A;padding:24px 32px;">
        <h1 style="color:white;margin:0;font-size:22px;letter-spacing:-0.5px;">LCK Technologies</h1>
        <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px;">Powered by Intellect, Driven by Values</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#8B3A3A;font-size:18px;margin:0 0 4px;">Request for Quotation</h2>
        <p style="color:#666;font-size:14px;margin:0 0 24px;">Dear ${params.supplierName},<br><br>
        Please provide your best pricing for the items listed below. Kindly reply to this email with your quotation by the deadline specified.</p>

        <table style="width:100%;border-collapse:collapse;background:#f9f9f9;border-radius:6px;overflow:hidden;margin-bottom:24px;">
          ${metaRows}
        </table>

        <h3 style="font-size:15px;margin:0 0 12px;">Items Required</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;margin-bottom:24px;">
          <thead>
            <tr style="background:#8B3A3A;color:white;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;width:32px;">#</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;">Description</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;width:60px;">Qty</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;width:60px;">Unit</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;">Notes / Spec</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        ${params.labourRequired && params.labourScope ? `
        <div style="margin-bottom:24px;padding:16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;">
          <p style="margin:0 0 6px;font-weight:600;font-size:14px;color:#92400e;">Labour / Installation Required</p>
          <p style="margin:0;font-size:14px;color:#555;">${params.labourScope}</p>
        </div>` : ''}

        ${params.notes ? `
        <div style="margin-bottom:24px;padding:16px;background:#f8f8f8;border-radius:4px;">
          <p style="margin:0 0 6px;font-weight:600;font-size:14px;">Additional Notes</p>
          <p style="margin:0;font-size:14px;color:#555;">${params.notes}</p>
        </div>` : ''}

        <div style="padding-top:20px;border-top:1px solid #e8e8e8;">
          <p style="font-size:14px;color:#555;margin:0 0 8px;">Please reply to this email with your quotation, including unit prices and totals, or contact us directly:</p>
          <p style="font-size:14px;font-weight:600;margin:0;">${params.contactName}</p>
          <p style="font-size:14px;color:#8B3A3A;margin:4px 0 0;"><a href="mailto:${params.contactEmail}" style="color:#8B3A3A;">${params.contactEmail}</a></p>
        </div>
      </div>
      <div style="background:#f5f5f5;padding:14px 32px;text-align:center;">
        <p style="font-size:12px;color:#aaa;margin:0;">LCK Technologies · Sent via LCK Commercial Operations Platform</p>
      </div>
    </body></html>`

    await this.transporter.sendMail({
      from: config.smtp.from,
      to: params.to,
      subject: `RFQ ${params.referenceNumber} — ${params.projectTitle}`,
      html,
    })
  }
}
