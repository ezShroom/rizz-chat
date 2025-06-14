import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	dialect: 'sqlite',
	driver: 'durable-sqlite',
	out: './packages/shared/src/db/local/drizzle',
	schema: './packages/shared/src/db/local/schema.ts'
})
