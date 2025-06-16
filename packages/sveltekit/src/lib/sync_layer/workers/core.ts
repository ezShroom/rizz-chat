import { getOPFSDatabase } from './backend/storage'
import {
	CloseReason,
	DownstreamWsMessageAction,
	globalConfig,
	isDownstreamWsMessage,
	localMigrations,
	localSchema,
	UpstreamWsMessageAction,
	type DownstreamWsMessage,
	type ReliableUpstreamWsMessage,
	type UpstreamWsMessage
} from 'shared'
import { migrate } from './backend/storage/migrate'
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import { UpstreamAnySyncMessageAction } from '$lib/types/sync_comms/upstream/UpstreamAnySyncMessageAction'
import type { UpstreamSyncLayerMessage } from '$lib/types/sync_comms/upstream/UpstreamSyncLayerMessage'
import type { DownstreamBridgeMessage } from '$lib/types/sync_comms/downstream/DownstreamBridgeMessage'
import { DownstreamAnySyncMessageAction } from '$lib/types/sync_comms/downstream/DownstreamAnySyncMessageAction'
import { Superiority } from '$lib/types/sync_comms/Superiority'
import type { DiscriminatedSyncLayerMessage } from '$lib/types/sync_comms/DiscriminatedSyncLayerMessage'
import SuperJSON from 'superjson'
import type { LocalCacheThread } from '$lib/types/cache/LocalCacheThread'
import type { LocalCacheMessage } from '$lib/types/cache/LocalCacheMessage'
import type { ConnectionStatusSummary } from '$lib/types/worker_connections/ConnectionStatusSummary'
import { WsStatus } from '$lib/types/worker_connections/WsStatus'
import { DbStatus } from '$lib/types/worker_connections/DbStatus'
import { eq, sql } from 'drizzle-orm'

const WS_URL = 'ws://localhost:8787/session'

export class SyncLayer {
	private crossWorkerChannel = new BroadcastChannel('workers')
	private postMessage(message: DiscriminatedSyncLayerMessage) {
		this.crossWorkerChannel.postMessage(message)
	}
	private sendToMainThread: (message: DownstreamBridgeMessage) => unknown
	private distributeWidelyAsLeader(message: DownstreamBridgeMessage) {
		this.sendToMainThread(message)
		this.postMessage({
			for: Superiority.Follower,
			message
		})
	}

	private db: SqliteRemoteDatabase<typeof localSchema> | undefined
	private ws: WebSocket
	private currentWsConnectionNumber = 0
	private wsQueue = new Map<string, ReliableUpstreamWsMessage>()
	private missedPings = 0
	private memoryDataModel: {
		synced: boolean
		threads: LocalCacheThread[]
		messages: Map<string, LocalCacheMessage[]>
		[key: string]: unknown
	} = {
		synced: false,
		threads: [],
		messages: new Map(),
		attachments: [],
		settings: {},
		subTier: {}
	}
	private pingInterval: ReturnType<typeof setInterval> | undefined
	private sendReliably(message: ReliableUpstreamWsMessage) {
		this.wsQueue.set(message.respondTo, message)
		if (this.ws.readyState === this.ws.OPEN) this.ws.send(SuperJSON.stringify(message))
	}

	private allowWsConnectionPromise = new Promise<void>((resolve) => {
		resolve()
	})
	private wsNotRelevant(connectionNumber: number) {
		return this.currentWsConnectionNumber !== connectionNumber
	}
	private async establishWs(initWs: boolean = true) {
		await this.allowWsConnectionPromise
		this.allowWsConnectionPromise = new Promise((resolve) => setTimeout(resolve, 500))
		if (initWs) this.ws = new WebSocket(WS_URL)
		const currentWs = this.ws
		this.currentWsConnectionNumber++
		const thisWsConnection = this.currentWsConnectionNumber
		this.memoryDataModel.synced = false
		this.ws.onmessage = (event) => {
			if (this.wsNotRelevant(thisWsConnection)) currentWs.close()
			if (event.data === '!') return (this.missedPings = 0) // ? response is !

			let decoded: DownstreamWsMessage
			try {
				const potentialDownstream = SuperJSON.parse(event.data)
				if (!isDownstreamWsMessage(potentialDownstream))
					return console.error('Invalid message received!\n', event.data)
				if ('responseTo' in potentialDownstream) this.wsQueue.delete(potentialDownstream.responseTo)
				decoded = potentialDownstream
			} catch {
				return console.error('Error while parsing message!\n', event.data)
			}

			switch (decoded.action) {
				case DownstreamWsMessageAction.RequireRefresh:
					this.sendToMainThread({ action: DownstreamAnySyncMessageAction.ReloadImmediately })
					return
				case DownstreamWsMessageAction.NoChangesToReport:
					// yay
					this.memoryDataModel.synced = true
					return
				case DownstreamWsMessageAction.MessageSent:
					if (decoded.newThreadDetails) {
						console.log('new thread')
					}
					return
				case DownstreamWsMessageAction.NewMessageToken:
					// this requires some context knowledge, don't push to memory right now
					console.log('token')
					return
				default:
					console.log('Message did not match a handling case:', decoded)
			}
		}
		this.ws.onopen = () => {
			if (this.wsNotRelevant(thisWsConnection)) currentWs.close()
			this.ws.send(
				SuperJSON.stringify({
					action: UpstreamWsMessageAction.Hello,
					version: globalConfig.version.current
				} satisfies UpstreamWsMessage)
			)
			this.pingInterval = setInterval(() => {
				if (this.ws.readyState === this.ws.OPEN && this.pingInterval) this.ws.send('?')
				this.missedPings++
				console.debug('Sent ping - missed', this.missedPings)
			}, 2500)
			this.missedPings = 0
			for (const queuedWsMessage of this.wsQueue.values()) {
				this.ws.send(SuperJSON.stringify(queuedWsMessage))
			}

			// Since we're now an available resource, we need to nudge the local message queue along too
			this.processMessagesAwaitingResources()
		}
		this.ws.onerror = () => {
			if (this.wsNotRelevant(thisWsConnection)) return
			clearInterval(this.pingInterval)
			// Just in case, to make sure we're not queueing up loads of sockets we won't use
			this.ws.close()
			this.establishWs()
		}
		this.ws.onclose = (event) => {
			if (this.wsNotRelevant(thisWsConnection)) return
			clearInterval(this.pingInterval)
			switch (event.code) {
				case CloseReason.SchemaNotSatisfied:
				case CloseReason.BadModelConfig:
					this.sendToMainThread({ action: DownstreamAnySyncMessageAction.ReloadImmediately })
					return
				default:
					// Give this socket another go!
					this.establishWs()
			}
		}
	}

	private wsOnly: boolean | undefined

	private superiority: Superiority

	private messageQueue = new Map<string, UpstreamSyncLayerMessage>()
	private messageAwaitingResourcesQueue = new Map<string, UpstreamSyncLayerMessage>()

	private connectionStatusSummary(): ConnectionStatusSummary {
		return {
			ws: this.ws.readyState === this.ws.OPEN ? WsStatus.Connected : WsStatus.NotConnected,
			db: this.db
				? DbStatus.Connected
				: this.wsOnly
					? DbStatus.NeverConnecting
					: DbStatus.PotentiallyConnecting
		}
	}

	// Some notes on messages:
	// - Messages can be sent by any tab (especially if we are a SharedWorker, which it isn't our job to know)
	//   so they must be responded to everywhere
	// - There are 6 states we can be in resources-wise:
	//   DB:
	//   - Never connecting
	//   - Potentially connecting (we might only find out we can't later!)
	//   - Connected
	//   WS:
	//   - Not connected
	//   - Connected
	//   If we have no resources (no DB or WS) and we need resources, we send to messageAwaitingResourcesQueue.
	//   As soon as resources are available, all messages in messageAwaitingResourcesQueue will be submitted again.
	public async messageIn(message: UpstreamSyncLayerMessage) {
		console.log('messageIn')
		if (this.superiority === Superiority.Follower) {
			console.debug('Forwarded message because this worker has no lock:', message)
			this.messageQueue.set(message.id, message)
			this.postMessage({ for: Superiority.Leader, message })
			return
		}
		switch (message.action) {
			case UpstreamAnySyncMessageAction.GiveInitialData: {
				const connectionStatus = this.connectionStatusSummary()
				console.log(connectionStatus)
				// Prefer local data. In this case, it cannot be impossible to respond because we can omit messages if we don't have them
				/*if (connectionStatus.db === DbStatus.Connected && this.memoryDataModel.threads.length > 0) {
					// Since we have threads in memory, check if one of them match the initial page focus
					let requestedThreadMessages: LocalCacheMessage[] | undefined
					if (
						message.includeMessagesFrom &&
						this.memoryDataModel.threads.some((thread) => thread.id === message.includeMessagesFrom)
					) {
						// Try to set requestedThreadMessages
						requestedThreadMessages =
							this.memoryDataModel.messages.get(message.includeMessagesFrom) ??
							(await (async (): Promise<LocalCacheMessage[] | undefined> => {
								const rawDbOutput = await this.db
									?.select()
									.from(localSchema.message)
									.where(eq(localSchema.message.threadId, sql.placeholder('threadId')))
									.prepare()
									.execute({ threadId: message.includeMessagesFrom })
								if (!rawDbOutput || rawDbOutput.length === 0) return
								const messages = rawDbOutput.map((item) => ({
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
								this.memoryDataModel.messages.set(message.includeMessagesFrom ?? '', messages)
								return messages
							})())
					}
					this.distributeWidelyAsLeader({
						action: DownstreamAnySyncMessageAction.InitialData,
						responseTo: message.id,
						threads: this.memoryDataModel.threads,
						requestedThreadMessages
					})
					return
				}*/
				if (connectionStatus.ws === WsStatus.Connected) {
					if (!this.wsQueue.has(message.id))
						this.sendReliably({
							action: UpstreamWsMessageAction.GiveThreadsAndPossiblyMessages,
							respondTo: message.id,
							messagesFromThread: message.includeMessagesFrom
						})
					if (connectionStatus.db === DbStatus.NeverConnecting) return
				}
				// No resources (or only ws, in which case the database *might* come alive) allow for this request to succeed - queue it for when it can
				this.messageAwaitingResourcesQueue.set(message.id, message)
			}
		}
	}
	private processMessagesAwaitingResources() {
		this.messageAwaitingResourcesQueue.forEach(this.messageIn.bind(this))
	}

	private migrated = false
	private async migrateIfNeeded() {
		await navigator.locks.request('migration', async () => {
			if (this.migrated || !this.db) return
			await migrate(this.db, localMigrations)
			this.migrated = true
		})
	}
	private async init() {
		navigator.locks.request('worker_comms', async () => {
			if (this.db) await this.migrateIfNeeded()
			this.superiority = Superiority.Leader
			this.crossWorkerChannel.postMessage({
				for: Superiority.Follower,
				message: { action: DownstreamAnySyncMessageAction.NewLeaderSoPleaseSprayQueuedMessages }
			} satisfies DiscriminatedSyncLayerMessage)
			this.messageQueue.forEach(this.messageIn.bind(this))
			// Do not clear the message queue - we need it to figure out whether to respond within this worker!
			await new Promise(() => {}) // Keep this lock until the worker dies
		})

		// If we can't have a local db, we're automatically ws-only
		if (
			!('storage' in navigator) ||
			!('getDirectory' in navigator.storage) ||
			!(await navigator.storage.getDirectory())
		) {
			this.wsOnly = false
			console.error('OPFS is disabled. We are falling back to WS only')
			this.sendToMainThread({ action: DownstreamAnySyncMessageAction.LocalDatabaseError })
			return
		}
		getOPFSDatabase()
			.then(async (db) => {
				if (this.superiority === Superiority.Leader) await this.migrateIfNeeded()
				this.db = db.drizzle
				if (this.superiority === Superiority.Leader) this.processMessagesAwaitingResources()
			})
			.catch((e) => {
				console.error('OPFS database could not be loaded because:', e)
				console.error('We are falling back to WS only')
				this.sendToMainThread({ action: DownstreamAnySyncMessageAction.LocalDatabaseError })
				this.wsOnly = true
			})
	}

	constructor(listener: (message: DownstreamBridgeMessage) => unknown) {
		console.log('constructor')
		this.superiority = Superiority.Follower
		this.crossWorkerChannel.onmessage = ({
			data: receivedMessage
		}: MessageEvent<DiscriminatedSyncLayerMessage>) => {
			console.debug('Received message over broadcast channel:', receivedMessage)
			console.debug('It is for superiority', receivedMessage.for, 'and we are', this.superiority)
			if (receivedMessage.for !== this.superiority) return
			if (receivedMessage.for === Superiority.Follower) {
				const { message } = receivedMessage
				if ('responseTo' in message) this.messageQueue.delete(message.responseTo)
				if (
					message.action === DownstreamAnySyncMessageAction.NewLeaderSoPleaseSprayQueuedMessages
				) {
					this.messageQueue.forEach((queuedMessage) =>
						this.crossWorkerChannel.postMessage({ for: Superiority.Leader, message: queuedMessage })
					)
					return
				}
				this.sendToMainThread(message)
				return
			}
			this.messageIn(receivedMessage.message)
		}
		this.sendToMainThread = listener
		this.ws = new WebSocket(WS_URL)
		this.establishWs(false) // We've already initialised so on this occasion, no need to do it again
		this.init()
	}
}
