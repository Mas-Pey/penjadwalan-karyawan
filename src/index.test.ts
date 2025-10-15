import { test, type TestContext } from 'node:test'
import { buildApp } from './server.ts'

let employeeId = ''

// ========================= Employee Feature Tests =========================
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

test("can return all employees", async (t: TestContext) => {
    t.plan(3)
    const app = buildApp({
        logger: false
    })

    const response = await app.inject({
        method: 'GET',
        url: '/employees',
    })

    t.assert.strictEqual(response.statusCode, 200, 'response 200')
    const json = response.json()
    t.assert.ok(Array.isArray(json.employees), 'employees is an array')
    t.assert.ok(json.employees.length > 0, 'employees is not empty')

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

// ========================= Schedule Feature Tests =========================
test("POST /create-schedule", async (t: TestContext) => {

    await t.test("can create schedule for a month", async (t: TestContext) => {
        t.plan(6)
        const app = buildApp({
            logger: false
        })

        const response = await app.inject({
            method: 'POST',
            url: '/create-schedule',
            payload: { month: 10, total_employee: 10 }
        }) 

        t.assert.strictEqual(response.statusCode, 200, 'response 200')
        const json = response.json()
        t.assert.equal(json.schedules.length, 30 * 2, 'there should be 60 shifts in October')
        t.assert.ok(response.json().summary, 'response has summary')

        const schedule = json.schedules[0]
        t.assert.ok(schedule.date, 'schedule has date')
        t.assert.ok(Array.isArray(schedule.employees), 'employees is an array')
        t.assert.ok(schedule.employees.length > 0, 'employees is not empty')
        t.assert.ok(schedule.time_start, 'schedule has time_start')
        t.assert.ok(schedule.time_end, 'schedule has time_end')
    })

    


})