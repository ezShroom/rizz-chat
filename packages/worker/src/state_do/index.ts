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
import { uuidv7 } from 'uuidv7'
import { gt } from 'semver'

export class UserStateDO extends DurableObject<Env> {
	private ongoingMessages: Record<
		string,
		{ threadId: string; started: Date; billFor: boolean; tokens: Record<number, string> }
	> = {}

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
			// Sync component
			// TODO: Sync component messages soon!

			// Pre-DB / unrelated messages
			case UpstreamWsMessageAction.Hello:
				// Here we only check if the client is outdated and suggest or require a refresh
				if (gt(globalConfig.version.requireReloadBefore, decoded.version))
					return ws.send(
						SuperJSON.stringify({
							action: DownstreamWsMessageAction.RequireRefresh
						} satisfies DownstreamWsMessage)
					)
				if (gt(globalConfig.version.suggestReloadBefore, decoded.version))
					ws.send(
						SuperJSON.stringify({
							action: DownstreamWsMessageAction.SuggestRefresh
						} satisfies DownstreamWsMessage)
					)
				return
			case UpstreamWsMessageAction.GiveThreadsAndPossiblyMessages: {
				// TODO: Use some memory
				return
			}
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

				const messageId = uuidv7()
				const messageDate = new Date()
				this.ongoingMessages[messageId] = {
					threadId: uuidv7(),
					started: messageDate,
					billFor: false,
					tokens: {}
				}
				this.ctx.getWebSockets().forEach((ws) =>
					ws.send(
						SuperJSON.stringify({
							action: DownstreamWsMessageAction.MessageSent,
							responseTo: decoded.respondTo,
							id: messageId,
							newThreadDetails: {
								id: uuidv7(),
								createdAt: messageDate
							}
						} satisfies DownstreamWsMessage)
					)
				)

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
						this.processTextStream(result.fullStream, messageId)
					}
				}
				return
			}
			default:
			// assertNever()
		}
	}

	private async processTextStream(
		stream: StreamTextResult<ToolSet, never>['fullStream'],
		messageId: string
	) {
		let existingTokens = 0
		for await (const part of stream) {
			if (!this.ongoingMessages[messageId]) return
			switch (part.type) {
				case 'text-delta':
					this.ongoingMessages[messageId].tokens[existingTokens] = part.textDelta
					existingTokens++
					this.ctx.getWebSockets().forEach((ws) => {
						ws.send(
							SuperJSON.stringify({
								action: DownstreamWsMessageAction.NewMessageToken,
								messageId: uuidv7(),
								content: part.textDelta,
								position: 1
							} satisfies DownstreamWsMessage)
						)
					})
					break
				default:
					console.log(part)
			}
		}
	}

	public hello() {
		return 'May I object? :)'
	}
}
