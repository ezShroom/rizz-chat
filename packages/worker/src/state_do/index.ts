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
	ModelProviders,
	frontlineSchema,
	frontlineMigrations
} from 'shared'
import { createGroq } from '@ai-sdk/groq'
import { streamText, type CoreMessage, type StreamTextResult, type ToolSet } from 'ai'
import { uuidv7 } from 'uuidv7'
import { gt } from 'semver'
import { drizzle, type DrizzleSqliteDODatabase } from 'drizzle-orm/durable-sqlite'
import { migrate } from 'drizzle-orm/durable-sqlite/migrator'
import { eq } from 'drizzle-orm'

export class UserStateDO extends DurableObject<Env> {
	private ongoingMessages: Record<
		string,
		{ threadId: string; started: Date; billFor: boolean; tokens: Record<number, string> }
	> = {}

	storage: DurableObjectStorage
	db: DrizzleSqliteDODatabase<Record<string, unknown>>
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env)

		if (!ctx.getWebSocketAutoResponse())
			ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('?', '!'))

		this.storage = ctx.storage
		this.db = drizzle(this.storage, { logger: false })

		// Make sure all migrations complete before accepting potential queries
		ctx.blockConcurrencyWhile(() => migrate(this.db, frontlineMigrations))
	}

	public override async fetch(/*request: Request*/) {
		const webSocketPair = new WebSocketPair()
		const [client, server] = Object.values(webSocketPair)
		if (!client || !server)
			return new Response('Could not generate WebSocket pair', { status: 500 })

		this.ctx.acceptWebSocket(server, [crypto.randomUUID()]) // Tag in case this client starts leading

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
				throw new Error(
					'Socket message does not conform to schema: ' + JSON.stringify(potentialUpstream)
				)
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
				const threads = await this.db.select().from(frontlineSchema.thread).execute()
				const relevantThreadMessages =
					decoded.messagesFromThread &&
					threads.some((thread) => thread.id === decoded.messagesFromThread)
						? await this.db
								.select()
								.from(frontlineSchema.message)
								.where(eq(frontlineSchema.message, decoded.messagesFromThread))
								.execute()
						: undefined
				ws.send(
					SuperJSON.stringify({
						action: DownstreamWsMessageAction.ThreadsAndPossiblyMessages,
						responseTo: decoded.respondTo,
						threads: threads,
						requestedMessages: relevantThreadMessages
							? relevantThreadMessages.map((item) => ({
									id: item.id,
									body: item.body,
									sent: item.createdAt,
									sender: item.sender,
									modelConfig: {
										model: item.model,
										reasoningLevel: item.reasoningLevel,
										search: item.search
									}
								}))
							: undefined
					} satisfies DownstreamWsMessage)
				)
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
			case UpstreamWsMessageAction.SyncClaimSuperiority:
			case UpstreamWsMessageAction.SyncGetThreadDiffs: {
				const clientId = this.ctx.getTags(ws)[0]
				if (!clientId) return // should be impossible
				if (decoded.action === UpstreamWsMessageAction.SyncClaimSuperiority) {
					await this.db
						.insert(frontlineSchema.leaders)
						.values({ id: clientId })
						.onConflictDoNothing()
						.execute()
				}

				// 'diffs' is a bit of a misleading term but we'll stick with it
				// basically this is just a request for all the threads
				const allTheThreads = await this.db.select().from(frontlineSchema.thread).execute()
				ws.send(
					SuperJSON.stringify({
						action: DownstreamWsMessageAction.SyncThreadDiffs,
						threadDiffs: allTheThreads
					} satisfies DownstreamWsMessage)
				)
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
