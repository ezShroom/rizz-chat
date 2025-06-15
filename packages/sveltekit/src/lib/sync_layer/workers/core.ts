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

export class SyncLayer {
	private crossWorkerChannel = new BroadcastChannel('workers')
	private postMessage(message: DiscriminatedSyncLayerMessage) {
		this.crossWorkerChannel.postMessage(message)
	}

	private sendToMainThread: (message: DownstreamBridgeMessage) => unknown

	private db: SqliteRemoteDatabase<typeof localSchema> | undefined
	private ws: WebSocket
	private wsQueue = new Map<string, ReliableUpstreamWsMessage>()
	private missedPings = 0
	private synced = false
	private pingInterval: ReturnType<typeof setInterval> | undefined
	private sendReliably(message: ReliableUpstreamWsMessage) {
		this.wsQueue.set(message.respondTo, message)
		if (this.ws.readyState === this.ws.OPEN) this.ws.send(SuperJSON.stringify(message))
	}
	private establishWs() {
		this.ws = new WebSocket('ws://localhost:8787/session')
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
					this.synced = true
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

	public async messageIn(message: UpstreamSyncLayerMessage) {
		if (this.superiority === Superiority.Follower) {
			console.debug('Forwarded message because this worker has no lock:', message)
			this.messageQueue.set(message.id, message)
			this.postMessage({ for: Superiority.Leader, message })
		}
		switch (message.action) {
			case UpstreamAnySyncMessageAction.GiveInitialData: {
				return
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
		this.wsOnly = Boolean(!(await navigator.storage.getDirectory()))
		if (this.wsOnly) {
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
				this.messageQueue.delete(message.id)
				this.sendToMainThread(message)
				return
			}
			this.messageIn(receivedMessage.message)
		}
		this.sendToMainThread = listener
		this.establishWs()
		this.init()
	}
}
