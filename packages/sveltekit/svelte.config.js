import adapter from '@sveltejs/adapter-cloudflare'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const config = {
	preprocess: vitePreprocess({ script: true }),
	kit: {
		adapter: adapter()
	}
}

export default config
