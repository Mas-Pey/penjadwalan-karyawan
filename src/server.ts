import Fastify from 'fastify'
import cors from '@fastify/cors'
import employeeRoute from './features/employee.ts'
import scheduleRoutes from './features/schedule.ts'
import type { Server } from 'https'
import type { FastifyBaseLogger, FastifyHttpOptions, FastifyInstance } from 'fastify'

export function buildApp(config: FastifyHttpOptions<Server, FastifyBaseLogger>): FastifyInstance {
    const server = Fastify(config)

    server.register(cors, {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    })

    server.register(employeeRoute)
    server.register(scheduleRoutes)

    return server
}