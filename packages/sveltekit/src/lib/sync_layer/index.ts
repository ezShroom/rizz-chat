class SyncLayer {
	constructor() {
		if (typeof window === 'undefined') return
		if (typeof window.SharedWorker !== 'function') {
			// android chrome backup option
			return
		}
		const worker = new Worker(new URL('./workers/standard.ts', import.meta.url), { type: 'module' })
	}
}
export const syncLayer = new SyncLayer()
