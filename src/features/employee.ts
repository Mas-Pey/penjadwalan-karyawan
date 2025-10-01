import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"
import fp from 'fastify-plugin'


/**
 * TYPES 
 * 
 */
interface EmployeeParams {
    id: string
}

interface EmployeeBody {
    name: string
}

/**
 * 
 * ROUTES
 */
const employeeRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get('/', async (request, reply) => {
        return { message: 'Hello, Fastify with TypeScript!' }
    })

    fastify.get<{ Params: EmployeeParams }>('/employee/:id',
        async (request, reply) => {
            const { id } = request.params
            return {
                userId: id,
                message: `Employee ID: ${id}`
            }
        }
    )

    fastify.post<{ Body: EmployeeBody }>('/employee',
        async (request, reply) => {
            const { name } = request.body
            return {
                success: true,
                user: { name },
                message: `Welcome ${name}`
            }
        }
    )

    fastify.put<{ Params: EmployeeParams; Body: EmployeeBody }>('/employee/:id',
        async (request, reply) => {
            const { id } = request.params
            const { name } = request.body
            return {
                success: true,
                message: `Update employee successfully`
            }
        }
    )

    fastify.delete<{ Params: EmployeeParams }>('/employee/:id',
        async (request: FastifyRequest<{ Params: EmployeeParams }>, reply: FastifyReply) => {
            const { id } = request.params
            return {
                userId: id,
                message: `Delete employee succesfully`
            }
        }
    )
}

export default fp(async function (app) {
    app.register(employeeRoutes)
})