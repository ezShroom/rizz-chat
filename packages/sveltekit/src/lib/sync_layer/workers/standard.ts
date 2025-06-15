import { SyncLayer } from './core'

const syncLayer = new SyncLayer(console.log)

self.onmessage = (event) => {
	console.log('i hath been messaged')
	syncLayer.messageIn(event.data)
}
