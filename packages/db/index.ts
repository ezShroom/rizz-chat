import { $ } from 'bun'

if (process.platform === 'win32') {
	console.error('The Turso CLI does not run on Windows')
	process.exit(1)
} else await $`turso dev --db-file ./dev.db`
