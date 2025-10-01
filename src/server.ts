import Fastify from 'fastify'
import employeeRoute from './features/employee.ts'
import type { Server } from 'https'
import type { FastifyBaseLogger, FastifyHttpOptions, FastifyInstance } from 'fastify'

export function buildApp(config: FastifyHttpOptions<Server, FastifyBaseLogger>): FastifyInstance {
    const server = Fastify(config)

    server.register(employeeRoute)

    return server
}