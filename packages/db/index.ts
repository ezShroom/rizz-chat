import { $ } from 'bun'

if (process.platform === 'win32') console.log('The Turso CLI does not run on Windows')
else await $`turso dev --db-file ./dev.db`
