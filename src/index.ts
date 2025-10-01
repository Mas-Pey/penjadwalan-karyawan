import Fastify from 'fastify'

// Create a Fastify server instance
const server = Fastify({
    logger: true
})

// Define a route
server.get('/', async (request, reply) => {
    return {message: 'Hello, Fastify with sss TypeScript!'}
})

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