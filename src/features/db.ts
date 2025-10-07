import Database from "better-sqlite3"
import type { Database as BetterSqliteDatabase } from "better-sqlite3"

const db: BetterSqliteDatabase = new Database('employee.db', { verbose: console.log })

db.prepare(`
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL 
    )
`).run()

export default db