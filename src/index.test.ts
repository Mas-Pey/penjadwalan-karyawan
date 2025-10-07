import { test, type TestContext } from 'node:test'
import { buildApp } from './server.ts'
import employee from './features/employee.ts'

let employeeId = ''


test("can create employee", async (t: TestContext) => {
    t.plan(3)
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'POST',
        url: '/employee',
        payload: { name: 'Newname-1' }
    })

    t.assert.strictEqual(response.statusCode, 200, 'response 200')
    const json = response.json()
    t.assert.deepStrictEqual(json.employee.name, 'Newname-1')
    t.assert.ok(json.employee.id)
    employeeId = json.employee.id
})

test("return error (404) if name is not a string", async (t: TestContext) => {
    t.plan(2)
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'POST',
        url: '/employee',
        payload: {
            name: 2025
        }
    })

    t.assert.strictEqual(response.statusCode, 404, 'response error')
    t.assert.deepStrictEqual(response.json(), {
        message: "Name must be a text"
    })
})

test("can return employee info", async (t: TestContext) => {
    t.plan(3)
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'GET',
        url: `/employee/${employeeId}`
    })

    t.assert.strictEqual(response.statusCode, 200, 'response 200')
    const json = response.json()
    t.assert.deepStrictEqual(json.employee.id, employeeId)
    t.assert.deepStrictEqual(json.employee.name, 'Newname-1')
})

test("can update employee data", async (t: TestContext) => {
    t.plan(2)
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'PUT',
        url: `/employee/${employeeId}`,
        payload: { name: 'Mulyadi' }
    })

    t.assert.strictEqual(response.statusCode, 200, 'response 200')
    const json = response.json()
    t.assert.deepStrictEqual(json.employee.name, 'Mulyadi')
})

test("return error (404) if employee not found when updating", async (t:TestContext) => {
    t.plan(2)
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'PUT',
        url: '/employee/-1',
        payload: { name: 'Mulyadi' }
    })

    t.assert.strictEqual(response.statusCode, 404, 'response error')
    t.assert.deepStrictEqual(response.json(), {
        message: "Employee not found"
    })
})

test("can delete employee", async (t: TestContext) => {
    t.plan(4)
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'DELETE',
        url: `/employee/${employeeId}`
    })

    t.assert.strictEqual(response.statusCode, 200, 'response 200')
    t.assert.deepEqual(response.json(), {
        message: `Employee ID : ${employeeId} successfully deleted`,
    })

    const check = await app.inject({
        method: 'GET',
        url: `/employee/${employeeId}`
    })
    t.assert.strictEqual(check.statusCode, 404, 'employee should not exist anymore')
    t.assert.deepEqual(check.json().message, 'Employee not found')
})

test("return error (404) if employee not found when deleting", async (t:TestContext) => {
    t.plan(2)
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'DELETE',
        url: '/employee/-1'
    })

    t.assert.strictEqual(response.statusCode, 404, 'response error')
    t.assert.deepStrictEqual(response.json(), {
        message: "Employee not found"
    })
})
