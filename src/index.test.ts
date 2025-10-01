import { test, type TestContext } from 'node:test'
import { buildApp } from './server.ts'

test("request the root", async (t: TestContext) => {
    t.plan(2)
     const app = buildApp({
        logger: false
     })

    const response = await app.inject({
        method: 'GET',
        url: '/'
    })

    t.assert.strictEqual(response.statusCode, 200, 'response 200')
    const json = response.json()
    t.assert.deepEqual(json, { message: 'Hello, Fastify with TypeScript!' })
})