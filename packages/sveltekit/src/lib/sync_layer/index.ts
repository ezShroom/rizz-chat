import type { DownstreamBridgeMessage } from '$lib/types/sync_comms/downstream/DownstreamBridgeMessage'
import { UpstreamAnySyncMessageAction } from '$lib/types/sync_comms/upstream/UpstreamAnySyncMessageAction'
import type { UpstreamBridgeMessage } from '$lib/types/sync_comms/upstream/UpstreamBridgeMessage'

class SyncLayer {
	constructor() {
		console.log("i am a SYNC LAYER and i'm digging a SYNC")

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
		}
		worker.onerror = (event) => console.log(event)
		worker.onmessageerror = (event) => console.log(event)
		worker.postMessage({
			action: UpstreamAnySyncMessageAction.GiveInitialData
		} satisfies UpstreamBridgeMessage)
	}
}
export const syncLayer = new SyncLayer()
