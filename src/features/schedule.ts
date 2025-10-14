import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"
import fp from 'fastify-plugin'

const EMPLOYEES = Array.from({ length: 10 }, (_, i) => `Employee ${i + 1}`)
const HOUR_SHIFT = 8
const OPEN_TIME = '07:00'
const CLOSED_TIME = '23:00'
const MINUMUM_HOUR_WORK_PER_WEEK = 30
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

const scheduleRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post<{ Body: { month: number }}>('/create-schedule',
        async (request, reply) => {
            const month = request.body.month // january start from 0
            const year = new Date().getFullYear()
            const totalDays = new Date(year, month, 0).getDate()

            const response: ScheduleResponse = {
                summary: {},
                schedules: []
            }

            const employeeHours: DaySchedule[] = []

            for (let day = 1; day <= totalDays; day++) {
                const date = new Date(year, month, day).toString()
                for (let shift = 1; shift <= SHIFT_PER_DAY; shift++) {

                    if (shift === 1) {
                        for (const employee of EMPLOYEES) {
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
                            }

                            if (shiftSchedule) {
                                if (shiftSchedule?.employees.length < SHIFT_PER_DAY) {
                                    shiftSchedule.employees.push(employee)
                                }
                            }
                            
                        }
                    }
                    
                    if (shift === 2) {
                        for (const employee of EMPLOYEES) {
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
                            }

                            if (shiftSchedule) {
                                if (shiftSchedule?.employees.length < SHIFT_PER_DAY) {
                                    shiftSchedule.employees.push(employee)
                                }
                            }
                        }
                    }

                }               
            }

            response.schedules = employeeHours
            return reply.send({
                response,
                message: "success create schedule"
            })
        })
}

export default fp(async function (app) {
    app.register(scheduleRoutes)
})