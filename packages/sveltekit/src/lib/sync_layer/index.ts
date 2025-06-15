import type { DownstreamBridgeMessage } from '$lib/types/sync_comms/downstream/DownstreamBridgeMessage'
import { UpstreamAnySyncMessageAction } from '$lib/types/sync_comms/upstream/UpstreamAnySyncMessageAction'
import type { UpstreamBridgeMessage } from '$lib/types/sync_comms/upstream/UpstreamBridgeMessage'

class SyncLayer {
	constructor() {
		if (typeof window === 'undefined') return
		if (typeof window.SharedWorker !== 'function') {
			// TODO: android chrome backup option
			return
		}
		const worker = new Worker(new URL('./workers/standard.ts', import.meta.url), { type: 'module' })
		worker.onmessage = (event: MessageEvent<DownstreamBridgeMessage>) => {
			console.log(event)
		}
		worker.postMessage({
			action: UpstreamAnySyncMessageAction.GiveInitialData
		} satisfies UpstreamBridgeMessage)
	}
}
export const syncLayer = new SyncLayer()
