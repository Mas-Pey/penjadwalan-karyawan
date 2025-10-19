import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"
import fp from 'fastify-plugin'
import db from './db.ts'

/**
 * TYPES 
 * 
 * 
 * 
 */
interface Employee {
    name: string
}

interface DaySchedule {
    date: string,
    employees: string[],
    time_start: string,
    time_end: string
}

interface OverworkedEmployee {
    name: string,
    totalHours: number,
    week: string
}

interface ScheduleSummary {
    median_of_weekly_hour: number,
    weekly_hour_breakdown: Record<string, Record<string, number>>
    monthly_hour_breakdown: Record<string, number>
    overworked_employees: OverworkedEmployee[]
}

interface ScheduleResponse {
    summary: ScheduleSummary,
    schedules: DaySchedule[]
}

interface ShiftTime {
    shift: number,
    time_start: string,
    time_end: string
}

/**
 * 
 * HELPER FUNCTIONS
 * 
 * 
 */
export function getEmployeeOnDate(
    date: string,
    employeeName: string,
    schedules: DaySchedule[]
): DaySchedule | null {
    const schedule = schedules.find(s => {
        const isSameDate = date === s.date
        const isEmployeeExist = s.employees.includes(employeeName)
        return isSameDate && isEmployeeExist
    })
    if (schedule) return schedule
    return null
}

export function getEmployeeOnShift(
    date: string,
    employeeName: string,
    shift: number,
    employee_per_shift: number,
    schedules: DaySchedule[],
    shiftTimes: ShiftTime[]
): DaySchedule | null {
    const shiftTime = shiftTimes[shift]
    if (!shiftTime) return null

    const schedule = schedules.find(s => {
        const isSameDate = date === s.date
        const isSameShift = s.time_start === shiftTime.time_start && s.time_end === shiftTime.time_end
        const isEmployeeExist = s.employees.includes(employeeName)
        if (isSameDate && isSameShift && !isEmployeeExist && s.employees.length <= employee_per_shift) {
            return true
        }
        return false
    })

    return schedule ?? null
}

export function addHours(
    employee: string,
    week: string,
    totalHoursWorkedPerEmployee: Record<string, number>,
    weeklyHours: Record<string, Record<string, number>>,
    hourShift: number
): void {
    totalHoursWorkedPerEmployee[employee] = (totalHoursWorkedPerEmployee[employee] || 0) + hourShift

    if (!weeklyHours[week]) weeklyHours[week] = {}
    weeklyHours[week][employee] = (weeklyHours[week][employee] || 0) + hourShift
}

export function getOverworkedEmployees(
    weeklyHours: Record<string, Record<string, number>>,
    threshold: number
): OverworkedEmployee[] {
    const overworked: { name: string; totalHours: number; week: string }[] = []
    for (const [week, hoursPerEmployee] of Object.entries(weeklyHours)) {
        for (const [employee, totalHours] of Object.entries(hoursPerEmployee)) {
            if (totalHours > threshold) {
                overworked.push({ name: employee, totalHours, week })
            }
        }
    }
    return overworked
}

export function getMedianofWeeklyHours(
    weeklyHours: Record<string, Record<string, number>>
): number {
    const allWeeklyHours: number[] = []

    for (const hoursPerEmployee of Object.values(weeklyHours)) {
        for (const totalHours of Object.values(hoursPerEmployee)) {
            allWeeklyHours.push(totalHours)
        }
    }

    if (allWeeklyHours.length === 0) return 0

    allWeeklyHours.sort((a, b) => a - b)
    const mid = Math.floor(allWeeklyHours.length / 2)

    if (allWeeklyHours.length % 2 === 0) {
        return ((allWeeklyHours[mid - 1] ?? 0) + (allWeeklyHours[mid] ?? 0)) / 2
    } else {
        return allWeeklyHours[mid] ?? 0
    }
}

export function generateShiftTimes(
    openHour: number,
    shiftPerDay: number,
    hourShift?: number
): ShiftTime[] {
    const shiftTimes = []
    const hoursPerShift = hourShift ?? Math.floor(24 / shiftPerDay)

    for (let i = 0; i < shiftPerDay; i++) {
        const start = (openHour + i * hoursPerShift) % 24
        const end = (start + hoursPerShift) % 24
        shiftTimes.push({
            shift: i + 1,
            time_start: `${String(start).padStart(2, '0')}:00`,
            time_end: `${String(end).padStart(2, '0')}:00`
        })
    }

    return shiftTimes
}

/**
 * 
 * 
 * SCHEMA VALIDATION
 * 
 */
const createScheduleSchema = {
    body: {
        type: 'object',
        required: ['month', 'shift_per_day', 'open_hour', 'employee_per_shift'],
        properties: {
            month: { type: 'number', minimum: 0, maximum: 11 },
            shift_per_day: { type: 'number', minimum: 1 },
            open_hour: { type: 'number', minimum: 0, maximum: 23 },
            hour_shift: { type: 'number', minimum: 1 },
            employee_per_shift: { type: 'number', minimum: 1 },
            maximum_hour_per_week: { type: 'number', minimum: 1 }
        },
        additionalProperties: false
    }
}

/**
 * 
 * 
 * 
 * ROUTES
 */
const scheduleRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post<{
        Body: {
            month: number,
            shift_per_day: number,
            open_hour: number,
            hour_shift: number,
            employee_per_shift: number,
            maximum_hour_per_week?: number
        }
    }>('/create-schedule', { schema: createScheduleSchema },
        async (request, reply) => {
            const {
                month,
                shift_per_day,
                open_hour,
                hour_shift,
                employee_per_shift,
                maximum_hour_per_week = 40
            } = request.body

            const stmt = db.prepare("SELECT name FROM employees").all() as Employee[]
            const total_employee = stmt.length
            const EMPLOYEES = stmt.map((e: Employee) => e.name)

            if (total_employee === 0) {
                return reply.status(400).send({
                    error: "No employees",
                    message: "There are no employees available to create a schedule"
                })
            }

            if (employee_per_shift > total_employee) {
                return reply.status(400).send({
                    error: "Invalid configuration",
                    message: "Number of employees per shift cannot exceed total employees"
                })
            }

            if (shift_per_day * hour_shift > 24) {
                return reply.status(400).send({
                    error: "Invalid configuration",
                    message: "Total shift hours in a day exceed 24 hours"
                })
            }

            if (total_employee < shift_per_day * employee_per_shift) {
                return reply.status(400).send({
                    error: "Invalid configuration",
                    message: "Not enough employees to cover all shifts"
                })
            }

            const shiftTimes = generateShiftTimes(open_hour, shift_per_day, hour_shift)

            const year = new Date().getFullYear()
            const totalDays = new Date(year, month + 1, 0).getDate()
            const employeeHours: DaySchedule[] = []
            const totalHoursWorkedPerEmployee: Record<string, number> = {}
            EMPLOYEES.forEach(e => totalHoursWorkedPerEmployee[e] = 0)
            const weeklyHours: Record<string, Record<string, number>> = {}

            const response: ScheduleResponse = {
                summary: {
                    median_of_weekly_hour: 0,
                    weekly_hour_breakdown: {},
                    monthly_hour_breakdown: {},
                    overworked_employees: []
                },
                schedules: []
            }

            for (let day = 1; day <= totalDays; day++) {
                const date = new Date(year, month, day).toString()
                const weekNumber = Math.ceil(day / 7)
                const week = `week_${weekNumber}`

                for (let shift = 0; shift < shift_per_day; shift++) {

                    const sortedEmployees = [...EMPLOYEES].sort(
                        (a, b) => (totalHoursWorkedPerEmployee[a] || 0) - (totalHoursWorkedPerEmployee[b] || 0)
                    )

                    const shiftTime = shiftTimes[shift]
                    if (!shiftTime) continue

                    const { time_start, time_end } = shiftTime

                    for (const employee of sortedEmployees) {
                        const shiftSchedule = getEmployeeOnShift(
                            date,
                            employee,
                            shift,
                            employee_per_shift,
                            employeeHours,
                            shiftTimes
                        )

                        const isAlreadyScheduledToday = getEmployeeOnDate(
                            date,
                            employee,
                            employeeHours
                        )

                        if (isAlreadyScheduledToday) continue

                        if (!shiftSchedule) {
                            employeeHours.push({
                                date,
                                employees: [employee],
                                time_start,
                                time_end
                            })
                            addHours(employee, week, totalHoursWorkedPerEmployee, weeklyHours, hour_shift)
                        }

                        if (shiftSchedule && shiftSchedule.employees.length < employee_per_shift) {
                            shiftSchedule.employees.push(employee)
                            addHours(employee, week, totalHoursWorkedPerEmployee, weeklyHours, hour_shift)
                        }
                    }

                }
            }

            const overworkedEmployees = getOverworkedEmployees(weeklyHours, maximum_hour_per_week)
            const medianWeeklyWork = getMedianofWeeklyHours(weeklyHours)

            response.schedules = employeeHours
            response.summary = {
                median_of_weekly_hour: medianWeeklyWork,
                weekly_hour_breakdown: weeklyHours,
                monthly_hour_breakdown: totalHoursWorkedPerEmployee,
                overworked_employees: overworkedEmployees
            }
            return reply.send({
                ...response,
                message: "success create schedule"
            })
        })
}

export default fp(async function (app) {
    app.register(scheduleRoutes)
})