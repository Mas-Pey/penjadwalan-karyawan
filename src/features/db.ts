import Database from "better-sqlite3"
import type { Database as BetterSqliteDatabase } from "better-sqlite3"

const db: BetterSqliteDatabase = new Database('employee.db', { verbose: console.log })

// === TABLE employees ===
db.prepare(`
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL 
    )
`).run()

// === TABLE schedules ===
db.prepare(`
    CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        shift TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        employees TEXT NOT NULL
    )
`).run()

export default db