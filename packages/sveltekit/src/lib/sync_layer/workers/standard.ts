import type { DownstreamBridgeMessage } from '$lib/types/sync_comms/downstream/DownstreamBridgeMessage'
import type { UpstreamBridgeMessage } from '$lib/types/sync_comms/upstream/UpstreamBridgeMessage'
import { SyncLayer } from './core'

console.log('hello. i am standard')

const syncLayer = new SyncLayer((message) =>
	self.postMessage(message satisfies DownstreamBridgeMessage)
)

self.onmessage = (event: MessageEvent<UpstreamBridgeMessage>) => {
	console.log('i hath been messaged')
	const id = crypto.randomUUID()
	syncLayer.messageIn({ id, ...event.data }, true)
}
