import { defineConfig } from 'tsdown'

export default defineConfig({
	plugins: [
		{
			name: 'vite-plugin-sql-raw',
			transform(code, id) {
				if (id.endsWith('.sql')) {
					return `export default \`${code.replaceAll('`', '\\`')}\`;`
				}
			}
		}
	],
	platform: 'browser'
})
