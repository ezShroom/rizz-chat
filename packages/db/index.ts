import { $ } from 'bun'

if (process.platform === 'win32') {
	console.error(
		'The Turso CLI does not run on Windows. To set a dev environment up on windows, use bun dev-win in a Windows terminal and bun db in WSL.'
	)
	process.exit(1)
} else await $`turso dev --db-file ./dev.db`
