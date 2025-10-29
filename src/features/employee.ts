import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"
import fp, { fastifyPlugin } from 'fastify-plugin'
import db from './db.ts'

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

    fastify.get('/employees',
        async (request, reply) => {
            const stmt = db.prepare("SELECT * FROM employees").all()
            return {
                employees: stmt
            }
        }
    )

    fastify.get<{ Params: EmployeeParams }>('/employee/:id',
        async (request, reply) => {
            const stmt = db.prepare("SELECT * FROM employees WHERE id = ?").get(request.params.id)
            if (!stmt) {
                return reply.status(404).send({
                    message: "Employee not found"
                })
            }
            return {
                employee: stmt
            }
        }
    )

    fastify.post<{ Body: EmployeeBody }>('/employee',
        async (request, reply) => {
            if (typeof request.body.name !== "string") {
                return reply.status(400).send({
                    message: "Name must be a text"
                })
            }
            const stmt = db.prepare("INSERT INTO employees (name) VALUES (?)").run(request.body.name)
            return {
                message: `Employee '${request.body.name}' successfully added`,
                employee: {
                    id: Number(stmt.lastInsertRowid),
                    name: request.body.name
                }
            }
        }
    )

    fastify.put<{ Params: EmployeeParams; Body: EmployeeBody }>('/employee/:id',
        async (request, reply) => {
            const stmt = db.prepare("SELECT * FROM employees WHERE id = ?").get(request.params.id)
            if (!stmt) {
                return reply.status(404).send({
                    message: "Employee not found"
                })
            }
            db.prepare("UPDATE employees SET name = ? WHERE id = ?").run(request.body.name, request.params.id)
            return {
                employee: { 
                    id: Number(request.params.id), 
                    name: request.body.name 
                },
                message: `Employee ID : ${request.params.id} successfully updated`
            }
        }
    )

    fastify.delete<{ Params: EmployeeParams }>('/employee/:id',
        async (request, reply) => {
            const stmt = db.prepare("DELETE FROM employees WHERE id = ?").run(request.params.id)
            if (stmt.changes === 0) {
                return reply.status(404).send({
                    message: "Employee not found"
                })
            } 
            return {
                message: `Employee ID : ${request.params.id} successfully deleted`
            }
        }
    )
}

export default fp(async function (app) {
    app.register(employeeRoutes)
})