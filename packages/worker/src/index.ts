export default {
	async fetch(_request, _env, _ctx) {
		return new Response('AYUP')
	}
} satisfies ExportedHandler<Env>
