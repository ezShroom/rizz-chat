import { DurableObject } from 'cloudflare:workers'
import SuperJSON from 'superjson'
import {
	isUpstreamWsMessage,
	type UpstreamWsMessage,
	type DownstreamWsMessage,
	UpstreamWsMessageAction,
	DownstreamWsMessageAction,
	CloseReason,
	globalConfig,
	ModelProviders
} from 'shared'
import { createGroq } from '@ai-sdk/groq'
import { streamText, type CoreMessage, type StreamTextResult, type ToolSet } from 'ai'

export class UserStateDO extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env)

		if (!ctx.getWebSocketAutoResponse())
			ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('?', '!'))

		console.log('we have Constructed very hard')
	}

	public override async fetch(/*request: Request*/) {
		const webSocketPair = new WebSocketPair()
		const [client, server] = Object.values(webSocketPair)
		if (!client || !server)
			return new Response('Could not generate WebSocket pair', { status: 500 })

		this.ctx.acceptWebSocket(server)

		return new Response(null, {
			status: 101,
			webSocket: client
		})
	}

	public override async webSocketMessage(
		ws: WebSocket,
		message: string | ArrayBuffer
	): Promise<void> {
		let decoded: UpstreamWsMessage
		try {
			if (typeof message !== 'string') throw new Error('Socket message is not a string')
			const potentialUpstream = SuperJSON.parse(message)
			if (!isUpstreamWsMessage(potentialUpstream))
				throw new Error('Socket message does not conform to schema')
			decoded = potentialUpstream
		} catch (e) {
			console.error(e)
			ws.close(CloseReason.SchemaNotSatisfied)
			return
		}
		switch (decoded.action) {
			case UpstreamWsMessageAction.Hello:
				ws.send(
					SuperJSON.stringify({
						action: DownstreamWsMessageAction.NoChangesToReport
					} as DownstreamWsMessage)
				)
				return
			case UpstreamWsMessageAction.Submit: {
				const modelDetails = globalConfig.models[decoded.message.modelConfig.model]
				if (
					!modelDetails ||
					modelDetails.deprecated ||
					!modelDetails.configurableReasoningLevels.includes(
						decoded.message.modelConfig.reasoningLevel
					) ||
					(!modelDetails.provideSearchTool && decoded.message.modelConfig.search)
				)
					return ws.close(CloseReason.BadModelConfig)

				switch (modelDetails.provider) {
					case ModelProviders.Groq: {
						const groq = createGroq({ apiKey: this.env.GROQ_KEY })

						const messages: CoreMessage[] = [
							{
								content: decoded.message.body,
								role: 'user'
							}
						]

						const result = streamText({
							model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
							messages
						})
						this.processTextStream(result.fullStream)
					}
				}
				return
			}
			default:
			// assertNever()
		}
	}

	private async processTextStream(stream: StreamTextResult<ToolSet, never>['fullStream']) {
		for await (const part of stream) {
			switch (part.type) {
				case 'text-delta':
					this.ctx.getWebSockets().forEach((ws) => ws.send(part.textDelta))
			}
		}
	}

	public hello() {
		return 'May I object? :)'
	}
}
