import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"
import fp from 'fastify-plugin'
import db from './db.ts'
import employee from "./employee.ts"
import { start } from "repl"

/**
 * TYPES 
 * 
 */
interface ScheduleBody {
    month: number
    holidays?: string[]
}

interface Shift {
    time: string,
    start_time: string,
    end_time: string,
    hours: number
}

interface DPState {
    dayIndex: number,
    hoursWorked: number[]
}

/**
 * 
 * ROUTES
 */
const scheduleRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post<{ Body: ScheduleBody }>('/create-schedule',
        async (request, reply) => {
            const { month, holidays = [] } = request.body

            // --- VALIDATE MONTH ---
            if (typeof month !== "number" || month < 1 || month > 12) {
                return reply.status(404).send({
                    message: "The month must be a number between 1 and 12."
                })
            }

            // === DATE MANIPULATION ===
            const year = new Date().getFullYear()
            const totalDays = new Date(year, month, 0).getDate()
            const monthPad = String(month).padStart(2, "0");

            const allDates: string[] = []
            for (let day = 1; day <= totalDays; day++) {
                const date = `${year}-${monthPad}-${String(day).padStart(2, "0")}`
                if(!holidays.includes(date)){
                    allDates.push(date)
                }
            }

            // === FETCH EMPLOYEES ===
            const employees = db.prepare("SELECT name FROM employees").all() as { name: string }[]
            if (employees.length < 2){
                return reply.status(400).send({
                    message: "At least 2 employees are required to generate a schedule.",
                })
            }

            // === SHIFT CONFIGURATION ===
            const shifts = [
                {
                    time: "07:00-15:00", 
                    start_time: "07.00", 
                    end_time: "15:00", 
                    hours: 8
                },
                {   
                    time: "15:00-23:00", 
                    start_time: "15.00", 
                    end_time: "23:00", 
                    hours: 8
                }
            ]

            // --- INITIALIZE DATA STRUCTURES ---
            const schedule: any[] = []
            const weeklyHours: Record<string, number[]> = {}
            for (const emp of employees) {
                weeklyHours[emp.name] = [0, 0, 0, 0, 0] // assumption of 5 weeks/month
            }

            // --- DP FOR SCHEDULING ---
            
        }
    )
}

export default fp(async function (app) {
    app.register(scheduleRoutes)
})