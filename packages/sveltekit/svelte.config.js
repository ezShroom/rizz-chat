import adapter from '@sveltejs/adapter-cloudflare'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const config = {
	preprocess: vitePreprocess({ script: true }),
	kit: {
		adapter: adapter(),
		alias: {
			'@battlecards/shared/*': '../shared/*',
			'@battlecards/shared': '../shared'
		}
	}
}

export default config
