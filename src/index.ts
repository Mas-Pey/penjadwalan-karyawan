import Fastify from 'fastify'
import type { FastifyRequest, FastifyReply } from 'fastify';
import { request } from 'http';

// Create a Fastify server instance
const server = Fastify({
    logger: true
})

// Define a route
server.get('/', async (request, reply) => {
    return { message: 'Hello, Fastify with TypeScript!' }
})

// Define types for request parameters
interface EmployeeParams {
    id: string
}

// Define types for request body
interface EmployeeBody {
    name: string
}

server.get<{ Params: EmployeeParams }>('/employee/:id',
    async (request: FastifyRequest<{ Params: EmployeeParams }>, reply: FastifyReply) => {
        const { id } = request.params
        return {
            userId: id,
            message: `Employee ID: ${id}`
        }
    }
)

server.post<{ Body: EmployeeBody }>('/employee',
    async (request: FastifyRequest<{ Body: EmployeeBody }>, reply: FastifyReply) => {
        const { name } = request.body
        return {
            success: true,
            user: { name },
            message: `Welcome ${name}`
        }
    }
)

server.put<{ Params: EmployeeParams; Body: EmployeeBody }>('/employee/:id',
    async (request: FastifyRequest<{ Params: EmployeeParams; Body: EmployeeBody }>, reply: FastifyReply) => {
        const { id } = request.params
        const { name } = request.body
        return {
            success: true,
            message: `Update employee successfully`
        }
    }
)

server.delete<{ Params: EmployeeParams }>('/employee/:id',
    async (request: FastifyRequest<{ Params: EmployeeParams }>, reply: FastifyReply) => {
        const { id } = request.params
        return {
            userId: id,
            message: `Delete employee succesfully`
        }
    }
)

const start = async (): Promise<void> => {
    try {
        await server.listen({ port: 3000 })
        console.log('Server is running at http://localhost:3000')
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}

start()