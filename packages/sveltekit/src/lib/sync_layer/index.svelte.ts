import { DownstreamAnySyncMessageAction } from '$lib/types/sync_comms/downstream/DownstreamAnySyncMessageAction'
import type { DownstreamBridgeMessage } from '$lib/types/sync_comms/downstream/DownstreamBridgeMessage'
import { UpstreamAnySyncMessageAction } from '$lib/types/sync_comms/upstream/UpstreamAnySyncMessageAction'
import type { UpstreamBridgeMessage } from '$lib/types/sync_comms/upstream/UpstreamBridgeMessage'
import type { LocalCacheThread } from 'shared'

export type AppState = {
	threads: {
		syncing: boolean
		list: Omit<LocalCacheThread, 'completeMemoryHistoricalPicture'>[]
	}
	selectedThread: string | undefined
}

class SyncLayer {
	public data: AppState = $state({
		threads: {
			syncing: true,
			list: []
		},
		selectedThread: undefined
	})

	constructor() {
		console.log("i am a SYNC LAYER and i'm digging a SYNC")

		// This is why we need a class (because SvelteKit is really annoying about your use of window)
		if (typeof window === 'undefined') return
		if (typeof window.SharedWorker !== 'function') {
			// TODO: android chrome backup option
			return
		}

		console.log('i will now make a worker')
		const worker = new Worker(new URL('./workers/standard.ts', import.meta.url), { type: 'module' })
		console.log('i have now made a worker')
		worker.onmessage = (event: MessageEvent<DownstreamBridgeMessage>) => {
			console.log(event)
			const { data: message } = event
			switch (message.action) {
				case DownstreamAnySyncMessageAction.ReloadImmediately:
					return window.location.reload()
				case DownstreamAnySyncMessageAction.InitialData:
					this.data.threads.list = message.threads.sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime())
					this.data.threads.syncing = false // TODO: This is inaccurate, as InitialData has nothing to do with the sync layer
			}
		}
		worker.onerror = (event) => console.log(event)
		worker.onmessageerror = (event) => console.log(event)
		worker.postMessage({
			action: UpstreamAnySyncMessageAction.GiveInitialData
		} satisfies UpstreamBridgeMessage)
	}
}
export const syncLayer = new SyncLayer()
