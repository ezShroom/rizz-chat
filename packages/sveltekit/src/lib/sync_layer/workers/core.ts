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
import type { UpstreamBridgeMessage } from '$lib/types/sync_comms/upstream/UpstreamBridgeMessage'
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
	private establishWs(initWs: boolean = true) {
		if (initWs) this.ws = new WebSocket(WS_URL)
		this.memoryDataModel.synced = false
		this.ws.onmessage = (event) => {
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
		}
		this.ws.onerror = () => {
			clearInterval(this.pingInterval)
			this.establishWs()
		}
		this.ws.onclose = (event) => {
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

	private superiority: Superiority = Superiority.Follower

	private messageQueue = new Map<string, UpstreamBridgeMessage>()
	private followerMessageTimer = setInterval(() => {
		if (this.superiority === Superiority.Leader) return
		this.messageQueue.forEach((message, id) =>
			this.postMessage({
				for: Superiority.Leader,
				message: { id, ...message }
			} satisfies DiscriminatedSyncLayerMessage)
		)
	}, 500)

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

	public async messageIn(message: UpstreamSyncLayerMessage) {
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
				if (connectionStatus.db === DbStatus.Connected) {
					// Prefer local data. In this case, it cannot be impossible to respond because we can omit messages if we don't have them
					if (this.memoryDataModel.threads.length > 0) {
						// Since we have threads in memory, check if one of them match the initial page focus
						let requestedThreadMessages: LocalCacheMessage[] | undefined
						if (
							message.includeMessagesFrom &&
							this.memoryDataModel.threads.some(
								(thread) => thread.id === message.includeMessagesFrom
							)
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
					}
				}
			}
		}
	}

	private async init() {
		navigator.locks.request('worker_comms', async () => {
			if (this.db) await migrate(this.db, localMigrations)
			this.superiority = Superiority.Leader
			clearInterval(this.followerMessageTimer)
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
				if (this.superiority === Superiority.Leader) await migrate(db.drizzle, localMigrations)
				this.db = db.drizzle
			})
			.catch((e) => {
				console.error('OPFS database could not be loaded because:', e)
				console.error('We are falling back to WS only')
				this.sendToMainThread({ action: DownstreamAnySyncMessageAction.LocalDatabaseError })
				this.wsOnly = true
			})
	}

	constructor(listener: (message: DownstreamBridgeMessage) => unknown) {
		this.crossWorkerChannel.onmessage = ({
			data: receivedMessage
		}: MessageEvent<DiscriminatedSyncLayerMessage>) => {
			console.debug('Received message over broadcast channel:', receivedMessage)
			console.debug('It is for superiority', receivedMessage.for, 'and we are', this.superiority)
			if (receivedMessage.for !== this.superiority) return
			if (receivedMessage.for === Superiority.Follower) {
				const { message } = receivedMessage
				if ('responseTo' in message) this.messageQueue.delete(message.responseTo)
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
