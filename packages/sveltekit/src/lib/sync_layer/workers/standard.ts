import type { UpstreamSyncLayerMessage } from '$lib/types/sync_comms/upstream/UpstreamSyncLayerMessage'
import { SyncLayer } from './core'

const syncLayer = new SyncLayer(console.log)

self.onmessage = (event: MessageEvent<UpstreamSyncLayerMessage>) => {
	console.log('i hath been messaged')
	const id = crypto.randomUUID()
	syncLayer.messageIn({ id, ...event.data })
}
