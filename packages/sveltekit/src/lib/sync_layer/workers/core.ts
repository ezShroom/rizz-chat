import { getOPFSDatabase } from './backend/storage'
import { localMigrations, localSchema } from 'shared'
import { migrate } from './backend/storage/migrate'
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import { UpstreamAnySyncMessageAction } from '$lib/types/sync_comms/upstream/UpstreamAnySyncMessageAction'
import type { UpstreamSyncLayerMessage } from '$lib/types/sync_comms/upstream/UpstreamSyncLayerMessage'
import type { UpstreamBridgeMessage } from '$lib/types/sync_comms/upstream/UpstreamBridgeMessage'
import type { DownstreamBridgeMessage } from '$lib/types/sync_comms/downstream/DownstreamBridgeMessage'
import { DownstreamAnySyncMessageAction } from '$lib/types/sync_comms/downstream/DownstreamAnySyncMessageAction'
import { Superiority } from '$lib/types/sync_comms/Superiority'
import type { DiscriminatedSyncLayerMessage } from '$lib/types/sync_comms/DiscriminatedSyncLayerMessage'

export class SyncLayer {
	private crossWorkerChannel = new BroadcastChannel('workers')
	private specificListener: (message: DownstreamBridgeMessage) => unknown

	private db: SqliteRemoteDatabase<typeof localSchema> | undefined
	private ws: WebSocket
	private wsOnly: boolean | undefined

	private superiority: Superiority = Superiority.Follower

	private messageQueue = new Map<string, UpstreamBridgeMessage>()
	private followerMessageTimer = setInterval(() => {
		if (this.superiority === Superiority.Leader) return
		this.messageQueue.forEach((message, id) =>
			this.crossWorkerChannel.postMessage({
				for: Superiority.Leader,
				message: { id, ...message }
			} satisfies DiscriminatedSyncLayerMessage)
		)
	}, 500)

	public async messageIn(message: UpstreamSyncLayerMessage) {
		if (this.superiority === Superiority.Follower) {
			this.messageQueue.set(message.id, message)
			this.crossWorkerChannel.postMessage(message)
		}
		switch (message.action) {
			case UpstreamAnySyncMessageAction.GiveInitialData: {
				return
			}
		}
	}

	private async init() {
		navigator.locks.request('worker_comms', async () => {
			this.superiority = Superiority.Leader
			clearInterval(this.followerMessageTimer)
			await new Promise(() => {}) // Keep this lock until the worker dies
		})

		// If we can't have a local db, we're automatically ws-only
		this.wsOnly = Boolean(await navigator.storage.getDirectory())
		if (await navigator.storage.getDirectory())
			getOPFSDatabase()
				.then(async (db) => {
					await migrate(db.drizzle, localMigrations)
					this.db = db.drizzle
				})
				.catch((e) => {
					console.error('OPFS database could not be loaded because:', e)
					console.error('We are falling back to WS only')
					this.specificListener({ action: DownstreamAnySyncMessageAction.LocalDatabaseError })
					this.wsOnly = true
				})
		else {
			console.error('OPFS is disabled. We are falling back to WS only')
			this.specificListener({ action: DownstreamAnySyncMessageAction.LocalDatabaseError })
			this.wsOnly = true
		}
	}

	constructor(listener: (message: DownstreamBridgeMessage) => unknown) {
		this.crossWorkerChannel.onmessage = ({
			data: receivedMessage
		}: MessageEvent<DiscriminatedSyncLayerMessage>) => {
			if (receivedMessage.for !== this.superiority) return
			if (receivedMessage.for === Superiority.Follower) {
				const { message } = receivedMessage
				this.messageQueue.delete(message.id)
				this.specificListener(message)
				return
			}
			this.messageIn(receivedMessage.message)
		}
		this.specificListener = listener
		this.ws = new WebSocket('ws://localhost:8787/session')
		this.init()
	}
}
