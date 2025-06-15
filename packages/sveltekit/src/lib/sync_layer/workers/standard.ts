import type { UpstreamBridgeMessage } from '$lib/types/sync_comms/upstream/UpstreamBridgeMessage'
import { SyncLayer } from './core'

const syncLayer = new SyncLayer(console.log)

self.onmessage = (event: MessageEvent<UpstreamBridgeMessage>) => {
	console.log('i hath been messaged')
	const id = crypto.randomUUID()
	syncLayer.messageIn({ id, ...event.data })
}
