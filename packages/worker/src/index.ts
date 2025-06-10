export { UserStateDO } from './state_do'

export default {
	async fetch(request, env, _ctx) {
		/*
		const id = env.USER_STATE_DO.idFromName('ayyyyyyy')
		const stub = env.USER_STATE_DO.get(id)
		const text = await stub.hello()
		return new Response(text)
		*/

		const url = new URL(request.url)

		if (url.pathname !== '/session') return new Response('Not Found', { status: 404 })

		/*const groq = createGroq({ apiKey: env.GROQ_KEY })

		const messages: CoreMessage[] = [
			{
				content:
					'write a detailed lightly hyperbolic essay on how epic the cloudflare workers platform is',
				role: 'user'
			}
		]

		const result = streamText({
			model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
			messages
		})

		const stream = result.toDataStream()*/

		// TODO: Auth check here. The user should be allowed in without a session, but with Conditions

		const id = env.USER_STATE_DO.idFromName('aawawawhoaern')
		const stub = env.USER_STATE_DO.get(id)
		return stub.fetch(request)

		/*return new Response(stream, {
			headers: {
				'Access-Control-Allow-Origin': '*', // for dev, be more specific in prod
				'Access-Control-Allow-Methods': 'GET, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Content-Type': 'text/event-stream'
			}
		})*/
	}
} satisfies ExportedHandler<Env>
