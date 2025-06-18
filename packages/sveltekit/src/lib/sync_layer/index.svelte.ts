import { dev } from '$app/environment'
import { PUBLIC_SESSION_SERVER_ORIGIN } from '$env/static/public'
import { DownstreamAnySyncMessageAction } from '$lib/types/sync_comms/downstream/DownstreamAnySyncMessageAction'
import type { DownstreamBridgeMessage } from '$lib/types/sync_comms/downstream/DownstreamBridgeMessage'
import { UpstreamAnySyncMessageAction } from '$lib/types/sync_comms/upstream/UpstreamAnySyncMessageAction'
import type { UpstreamBridgeMessage } from '$lib/types/sync_comms/upstream/UpstreamBridgeMessage'
import type { LocalCacheThread } from 'shared'

export type AppState = {
	threads: {
		syncing: boolean
		list: LocalCacheThread[]
	}
	selectedThread: string | undefined
}

class AppThreadSyncLayer {
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
				case DownstreamAnySyncMessageAction.InitialData: {
					// 1. create a high-performance lookup set of existing thread ids.
					// this is O(n) where n is the number of existing threads.
					const existingThreadIds = new Set(this.data.threads.list.map((thread) => thread.id))

					// 2. filter the new threads, keeping only the ones that are not already in our set.
					// this is O(m) where m is the number of new threads.
					const newThreads = message.threads.filter(
						(newThread) => !existingThreadIds.has(newThread.id)
					)

					// 3. if there are any new threads, concatenate them and re-sort.
					if (newThreads.length > 0) {
						this.data.threads.list = [...this.data.threads.list, ...newThreads].sort(
							(a, b) => a.lastModified.getTime() - b.lastModified.getTime()
						)
					}
					return
				}
				case DownstreamAnySyncMessageAction.NetworkIssueBootedSyncLayer: {
					this.data.threads.syncing = true
					return
				}
				case DownstreamAnySyncMessageAction.ThreadsMutation: {
					this.data.threads.list = message.threads
					return
				}
			}
		}
		worker.onerror = (event) => console.log(event)
		worker.onmessageerror = (event) => console.log(event)

		worker.postMessage({
			action: UpstreamAnySyncMessageAction.EnsureInit,
			env: {
				PUBLIC_SESSION_SERVER_ORIGIN,
				dev
			}
		} satisfies UpstreamBridgeMessage)
		worker.postMessage({
			action: UpstreamAnySyncMessageAction.GiveInitialData
		} satisfies UpstreamBridgeMessage)
	}
}
export const syncLayer = new AppThreadSyncLayer()
