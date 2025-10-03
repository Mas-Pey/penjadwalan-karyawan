import Database from "better-sqlite3"

const db = new Database('employee.db', { verbose: console.log }) as any

db.prepare(`
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL 
    )
`).run()

export default db