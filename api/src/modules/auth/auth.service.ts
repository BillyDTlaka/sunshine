import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { AppError } from '../../shared/errors/AppError'

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) throw new AppError('Invalid credentials', 401)

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new AppError('Invalid credentials', 401)

    const { password: _, ...safeUser } = user
    return { user: safeUser }
  }

  async createUser(data: { email: string; password: string; firstName: string; lastName: string; role: string }) {
    const hashed = await bcrypt.hash(data.password, 10)
    return this.prisma.user.create({
      data: { ...data, password: hashed, role: data.role as any },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    })
  }
}
