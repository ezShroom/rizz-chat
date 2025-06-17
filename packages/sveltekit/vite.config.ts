import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'

export default defineConfig({
	plugins: [
		{
			name: 'vite-plugin-sql-raw',
			enforce: 'pre',
			transform(code, id) {
				if (id.endsWith('.sql')) {
					return `export default \`${code.replaceAll('`', '\\`')}\`;`
				}
			}
		},
		tailwindcss(),
		sveltekit(),
		devtoolsJson()
	],
	optimizeDeps: {
		exclude: ['wa-sqlite']
	},
	server: { fs: { allow: ['./package.json'] } }
})
