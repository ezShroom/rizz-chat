import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	dialect: 'turso',
	dbCredentials: {
		url: 'http://localhost:8080'
	},
	out: './packages/shared/src/db/auth/drizle'
})
