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
    t.assert.deepStrictEqual(response.json(), { message: 'Hello, Fastify with TypeScript!' })
})

test("can return employee info", async (t: TestContext) => {
    t.plan(2)
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'GET',
        url: '/employee/exampleid-6969'
    })

    t.assert.strictEqual(response.statusCode, 200, 'response 200')
    t.assert.deepStrictEqual(response.json(), {
        userId: 'exampleid-6969',
        message: `Employee ID: exampleid-6969`
    })
})

test("can create employee", async (t: TestContext) => {
    t.plan(2)
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'POST',
        url: '/employee',
        payload: { name: 'Pey' }
    })

    t.assert.strictEqual(response.statusCode, 200, 'response 200')
    t.assert.deepStrictEqual(response.json(), {
        success: true,
        user: { name: 'Pey' },
        message: `Welcome Pey`
    })
})

test("can update employee data", async (t: TestContext) => {
    t.plan(2)
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'PUT',
        url: '/employee/exampleid-6969',
        payload: { name: 'Pey Tampan' }
    })

    t.assert.strictEqual(response.statusCode, 200, 'response 200')
    t.assert.deepStrictEqual(response.json(), {
        success: true,
        message: 'Update employee successfully'
    })
})

test("can delete employee", async (t: TestContext) => {
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'DELETE',
        url: '/employee/exampleid-6969'
    })

    t.assert.strictEqual(response.statusCode, 200, 'response 200')
    t.assert.deepStrictEqual(response.json(), {
        userId: 'exampleid-6969',
        message: `Delete employee succesfully`
    })
})