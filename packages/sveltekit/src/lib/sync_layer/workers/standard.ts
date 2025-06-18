import type { DownstreamBridgeMessage } from '$lib/types/sync_comms/downstream/DownstreamBridgeMessage'
import { UpstreamAnySyncMessageAction } from '$lib/types/sync_comms/upstream/UpstreamAnySyncMessageAction'
import type { UpstreamBridgeMessage } from '$lib/types/sync_comms/upstream/UpstreamBridgeMessage'
import { SyncLayer, initEnv } from './core'

console.log('hello. i am standard')

let syncLayer: SyncLayer
let initDone = false

self.onmessage = (event: MessageEvent<UpstreamBridgeMessage>) => {
	if (event.data.action === UpstreamAnySyncMessageAction.EnsureInit) {
		if (initDone) return
		initEnv(event.data.env)
		syncLayer = new SyncLayer((message) =>
			self.postMessage(message satisfies DownstreamBridgeMessage)
		)
		initDone = true
		return
	}
	console.log('i hath been messaged')
	const id = crypto.randomUUID()
	syncLayer.messageIn({ id, ...event.data }, true)
}
