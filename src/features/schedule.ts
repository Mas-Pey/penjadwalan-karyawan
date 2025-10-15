import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"
import fp from 'fastify-plugin'

const EMPLOYEES = Array.from({ length: 10 }, (_, i) => `Employee ${i + 1}`)
const HOUR_SHIFT = 8
const OPEN_TIME = '07:00'
const CLOSED_TIME = '23:00'
const MINUMUM_HOUR_WORK_PER_WEEK = 30
const MAXIMUM_HOUR_WORK_PER_WEEK = 40
const SHIFT_PER_DAY = 2

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

interface OverworkedEmployee{
    name: string, 
    totalHours: number,
    week: string
}

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
    schedules: DaySchedule[]
): DaySchedule | null {
    const schedule = schedules.find(s => {
        const isSameDate = date === s.date
        const isSameShift = shift === 1
            ? s.time_start === '07:00' && s.time_end === '15:00'
            : s.time_start === '15:00' && s.time_end === '23:00'
        const isEmployeeExist = s.employees.includes(employeeName)
        if (isSameDate && isSameShift && !isEmployeeExist && s.employees.length <= SHIFT_PER_DAY) {
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
): void {
    totalHoursWorkedPerEmployee[employee] = (totalHoursWorkedPerEmployee[employee] || 0) + HOUR_SHIFT

    if (!weeklyHours[week]) weeklyHours[week] = {}
    weeklyHours[week][employee] = (weeklyHours[week][employee] || 0) + HOUR_SHIFT
}

export function getOverworkedEmployees(
    weeklyHours: Record<string, Record<string, number>>,
    threshold: number = MAXIMUM_HOUR_WORK_PER_WEEK
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

    allWeeklyHours.sort((a,b) => a - b)
    const mid = Math.floor(allWeeklyHours.length / 2)

    if (allWeeklyHours.length %2 === 0) {
        return ((allWeeklyHours[mid - 1] ?? 0) + (allWeeklyHours[mid] ?? 0)) / 2
    } else {
        return allWeeklyHours[mid] ?? 0
    }
}

const scheduleRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post<{ Body: { month: number } }>('/create-schedule',
        async (request, reply) => {
            const month = request.body.month // january start from 0
            const year = new Date().getFullYear()
            const totalDays = new Date(year, month + 1, 0).getDate()

            const response: ScheduleResponse = {
                summary: {},
                schedules: []
            }

            const employeeHours: DaySchedule[] = []

            const totalHoursWorkedPerEmployee: Record<string, number> = {}
            EMPLOYEES.forEach(e => totalHoursWorkedPerEmployee[e] = 0)

            const weeklyHours: Record<string, Record<string, number>> = {}

            for (let day = 1; day <= totalDays; day++) {
                const date = new Date(year, month, day).toString()
                const weekNumber = Math.ceil(day / 7)
                const week = `week_${weekNumber}`

                for (let shift = 1; shift <= SHIFT_PER_DAY; shift++) {

                    const sortedEmployees = [...EMPLOYEES].sort(
                        (a, b) => (totalHoursWorkedPerEmployee[a] || 0) - (totalHoursWorkedPerEmployee[b] || 0)
                    )

                    if (shift === 1) {
                        for (const employee of sortedEmployees) {
                            const shiftSchedule = getEmployeeOnShift(
                                date,
                                employee,
                                shift,
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
                                addHours(employee, week, totalHoursWorkedPerEmployee, weeklyHours)
                            }

                            if (shiftSchedule) {
                                if (shiftSchedule?.employees.length < SHIFT_PER_DAY) {
                                    shiftSchedule.employees.push(employee)
                                    addHours(employee, week, totalHoursWorkedPerEmployee, weeklyHours)
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
                                addHours(employee, week, totalHoursWorkedPerEmployee, weeklyHours)
                            }

                            if (shiftSchedule) {
                                if (shiftSchedule?.employees.length < SHIFT_PER_DAY) {
                                    shiftSchedule.employees.push(employee)
                                    addHours(employee, week, totalHoursWorkedPerEmployee, weeklyHours)
                                }
                            }
                        }
                    }

                }
            }

            const overworkedEmployees = getOverworkedEmployees(weeklyHours)
            const medianWeeklyWork = getMedianofWeeklyHours(weeklyHours)

            response.schedules = employeeHours
            response.summary = {
                median_of_weekly_hour: medianWeeklyWork,
                weekly_hour_breakdown: weeklyHours,
                monthly_hour_breakdown: totalHoursWorkedPerEmployee,
                overworked_employees: overworkedEmployees
            }
            return reply.send({
                response,
                message: "success create schedule"
            })
        })
}

export default fp(async function (app) {
    app.register(scheduleRoutes)
})