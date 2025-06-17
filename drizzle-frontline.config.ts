import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	dialect: 'sqlite',
	driver: 'durable-sqlite',
	out: './packages/shared/src/db/frontline/drizzle',
	schema: './packages/shared/src/db/frontline/schema.ts'
})
