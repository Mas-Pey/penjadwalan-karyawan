import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"
import fp from 'fastify-plugin'

/**
 * TYPES 
 * 
 * 
 * 
 */
interface DaySchedule {
    date: string,
    employees: string[],
    time_start: string,
    time_end: string
}

interface ScheduleResponse {
    summary: {},
    schedules: DaySchedule[]
}

interface OverworkedEmployee {
    name: string,
    totalHours: number,
    week: string
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
    shift_per_day: number,
    schedules: DaySchedule[]
): DaySchedule | null {
    const schedule = schedules.find(s => {
        const isSameDate = date === s.date
        const isSameShift = shift === 1
            ? s.time_start === '07:00' && s.time_end === '15:00'
            : s.time_start === '15:00' && s.time_end === '23:00'
        const isEmployeeExist = s.employees.includes(employeeName)
        if (isSameDate && isSameShift && !isEmployeeExist && s.employees.length <= shift_per_day) {
            return true
        }
        return false
    })
    if (schedule) {
        return schedule
    }
    return null
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

/**
 * 
 * 
 * SCHEMA VALIDATION
 * 
 */
const createScheduleSchema = {
    body: {
        type: 'object',
        required: ['month', 'total_employee', 'shift_per_day', 'hour_shift'],
        properties: {
            month: { type: 'number', minimum: 0, maximum: 11 },
            total_employee: { type: 'number', minimum: 1 },
            shift_per_day: { type: 'number', minimum: 1 },
            hour_shift: { type: 'number', minimum: 1 },
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
            total_employee: number,
            shift_per_day:number,
            hour_shift: number,
            maximum_hour_per_week?: number
        }
    }>('/create-schedule', { schema: createScheduleSchema },
        async (request, reply) => {
            const { month, total_employee, shift_per_day, hour_shift, maximum_hour_per_week = 40 } = request.body

            const year = new Date().getFullYear()
            const totalDays = new Date(year, month + 1, 0).getDate()
            const EMPLOYEES = Array.from({ length: total_employee }, (_, i) => `Employee ${i + 1}`)
            const employeeHours: DaySchedule[] = []
            const totalHoursWorkedPerEmployee: Record<string, number> = {}
            EMPLOYEES.forEach(e => totalHoursWorkedPerEmployee[e] = 0)
            const weeklyHours: Record<string, Record<string, number>> = {}

            const response: ScheduleResponse = {
                summary: {},
                schedules: []
            }

            for (let day = 1; day <= totalDays; day++) {
                const date = new Date(year, month, day).toString()
                const weekNumber = Math.ceil(day / 7)
                const week = `week_${weekNumber}`

                for (let shift = 1; shift <= shift_per_day; shift++) {

                    const sortedEmployees = [...EMPLOYEES].sort(
                        (a, b) => (totalHoursWorkedPerEmployee[a] || 0) - (totalHoursWorkedPerEmployee[b] || 0)
                    )

                    if (shift === 1) {
                        for (const employee of sortedEmployees) {
                            const shiftSchedule = getEmployeeOnShift(
                                date,
                                employee,
                                shift,
                                shift_per_day,
                                employeeHours
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
                                    time_start: '07:00',
                                    time_end: '15:00'
                                })
                                addHours(employee, week, totalHoursWorkedPerEmployee, weeklyHours, hour_shift)
                            }

                            if (shiftSchedule) {
                                if (shiftSchedule?.employees.length < shift_per_day) {
                                    shiftSchedule.employees.push(employee)
                                    addHours(employee, week, totalHoursWorkedPerEmployee, weeklyHours, hour_shift)
                                }
                            }

                        }
                    }

                    if (shift === 2) {
                        for (const employee of sortedEmployees) {
                            const shiftSchedule = getEmployeeOnShift(
                                date,
                                employee,
                                shift,
                                shift_per_day,
                                employeeHours
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
                                    time_start: '15:00',
                                    time_end: '23:00'
                                })
                                addHours(employee, week, totalHoursWorkedPerEmployee, weeklyHours, hour_shift)
                            }

                            if (shiftSchedule) {
                                if (shiftSchedule?.employees.length < shift_per_day) {
                                    shiftSchedule.employees.push(employee)
                                    addHours(employee, week, totalHoursWorkedPerEmployee, weeklyHours, hour_shift)
                                }
                            }
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