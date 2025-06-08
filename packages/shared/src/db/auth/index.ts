import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

export function getDB({
	DATABASE_URL,
	DATABASE_AUTH_TOKEN
}: {
	DATABASE_URL: string
	DATABASE_AUTH_TOKEN?: string
}) {
	const client = createClient({
		url: DATABASE_URL,
		authToken: DATABASE_AUTH_TOKEN ?? undefined
	})
	return drizzle(client, {
		schema
		// logger: true
	})
}
