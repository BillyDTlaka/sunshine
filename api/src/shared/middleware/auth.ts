import { FastifyRequest, FastifyReply } from 'fastify'
import { ForbiddenError, UnauthorizedError } from '../errors/AppError'

export type UserRole =
  | 'ADMIN'
  | 'SALES'
  | 'PROCUREMENT'
  | 'FINANCE'
  | 'DELIVERY_MANAGER'
  | 'APPROVER'
  | 'SENIOR_APPROVER'

export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: JwtPayload
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    if (!request.user) throw new UnauthorizedError()
    if (!allowedRoles.includes(request.user.role)) {
      throw new ForbiddenError(`Role ${request.user.role} is not permitted to perform this action`)
    }
  }
}
