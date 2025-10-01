import Fastify, { type FastifyInstance } from 'fastify'
import employeeRoute from './features/employee.ts'

export function buildApp(): FastifyInstance {
    const server = Fastify({
        logger: true
    })

    server.register(employeeRoute)

    return server
}