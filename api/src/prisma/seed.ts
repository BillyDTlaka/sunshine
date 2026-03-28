import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 10)

  await prisma.user.upsert({
    where: { email: 'admin@sunshine.co.za' },
    update: {},
    create: { email: 'admin@sunshine.co.za', firstName: 'Admin', lastName: 'User', password: await hash('Admin@1234'), role: 'ADMIN' },
  })
  await prisma.user.upsert({
    where: { email: 'sales@sunshine.co.za' },
    update: {},
    create: { email: 'sales@sunshine.co.za', firstName: 'Sales', lastName: 'User', password: await hash('Sales@1234'), role: 'SALES' },
  })
  await prisma.user.upsert({
    where: { email: 'procurement@sunshine.co.za' },
    update: {},
    create: { email: 'procurement@sunshine.co.za', firstName: 'Procurement', lastName: 'Officer', password: await hash('Procure@1234'), role: 'PROCUREMENT' },
  })
  await prisma.user.upsert({
    where: { email: 'finance@sunshine.co.za' },
    update: {},
    create: { email: 'finance@sunshine.co.za', firstName: 'Finance', lastName: 'User', password: await hash('Finance@1234'), role: 'FINANCE' },
  })
  await prisma.user.upsert({
    where: { email: 'approver@sunshine.co.za' },
    update: {},
    create: { email: 'approver@sunshine.co.za', firstName: 'Approver', lastName: 'User', password: await hash('Approve@1234'), role: 'APPROVER' },
  })

  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
