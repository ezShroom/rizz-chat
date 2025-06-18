import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type PluginOption } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'

const sqlRawPlugin: PluginOption = {
	name: 'vite-plugin-sql-raw',
	enforce: 'pre',
	transform(code, id) {
		if (id.endsWith('.sql')) {
			return `export default \`${code.replaceAll('`', '\\`')}\`;`
		}
	}
}

export default defineConfig({
	plugins: [sqlRawPlugin, tailwindcss(), sveltekit(), devtoolsJson()],
	worker: {
		plugins: () => [sqlRawPlugin]
	},
	optimizeDeps: {
		exclude: ['wa-sqlite']
	},
	server: { fs: { allow: ['./package.json'] } }
})
