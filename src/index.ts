import { buildApp } from './server.ts'

const server = buildApp({
    logger: true
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