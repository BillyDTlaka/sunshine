export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  appUrl: process.env.APP_URL ?? 'http://localhost:3001',
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.EMAIL_FROM ?? 'noreply@sunshine.co.za',
  },
  storage: {
    bucket: process.env.STORAGE_BUCKET ?? 'sunshine-attachments',
    region: process.env.STORAGE_REGION ?? 'af-south-1',
    accessKey: process.env.STORAGE_ACCESS_KEY ?? '',
    secretKey: process.env.STORAGE_SECRET_KEY ?? '',
    endpoint: process.env.STORAGE_ENDPOINT ?? '',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM ?? '',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  },
  approval: {
    quoteThreshold: parseInt(process.env.QUOTE_APPROVAL_THRESHOLD ?? '50000', 10),
    requisitionThreshold: parseInt(process.env.REQUISITION_APPROVAL_THRESHOLD ?? '25000', 10),
  },
}
