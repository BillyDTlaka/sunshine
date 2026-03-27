import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { AuthService } from './auth.service'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const authRoutes: FastifyPluginAsync = async (app) => {
  const authService = new AuthService(app.prisma)

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const result = await authService.login(body.email, body.password)
    const token = app.jwt.sign({ userId: result.user.id, email: result.user.email, role: result.user.role })
    return reply.send({ token, user: result.user })
  })

  app.get('/me', { preHandler: [async (req) => { await req.jwtVerify() }] }, async (request) => {
    return (request as any).user
  })
}

export default authRoutes
