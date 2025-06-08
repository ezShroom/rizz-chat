import { createGroq } from '@ai-sdk/groq'
import { streamText, type CoreMessage } from 'ai'

export { UserStateDO } from './state_do'

export default {
	async fetch(_request, env, _ctx) {
		/*
		const id = env.USER_STATE_DO.idFromName('ayyyyyyy')
		const stub = env.USER_STATE_DO.get(id)
		const text = await stub.hello()
		return new Response(text)
		*/

		const groq = createGroq({ apiKey: env.GROQ_KEY })

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

		const stream = result.toDataStream()
		return new Response(stream, {
			headers: {
				'Access-Control-Allow-Origin': '*', // for dev, be more specific in prod
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Content-Type': 'text/event-stream'
			}
		})
	}
} satisfies ExportedHandler<Env>
