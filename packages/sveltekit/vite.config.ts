import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		{
			name: 'vite-plugin-sql-raw',
			enforce: 'pre',
			transform(code, id) {
				if (id.endsWith('.sql')) {
					return `export default \`${code.replaceAll('`', '\\`')}\`;`
				}
			}
		}
	],
	server: { fs: { allow: ['./package.json'] } }
})
