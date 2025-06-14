import { sql } from 'drizzle-orm'
import { getOPFSDatabase } from './backend/storage'
import { localMigrations } from 'shared'

const x = await getOPFSDatabase()
console.log(localMigrations)

const migrationsTable = '__drizzle_migrations'
const a = await x.run(sql`
    CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      hash TEXT NOT NULL,
      tag TEXT NOT NULL,
      created_at numeric
    )`)
const dbMigrations = await x.values<[number, string, string]>(
	sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
)

console.log(a, dbMigrations, localMigrations)
