<script lang="ts">
	import SuperJSON from 'superjson'
	import ChatRoot from './ChatRoot.svelte'
	import {
		isDownstreamWsMessage,
		type DownstreamWsMessage,
		type ReliableUpstreamWsMessage
	} from 'shared'
	import {
		type UpstreamWsMessage,
		UpstreamWsMessageAction,
		DownstreamWsMessageAction,
		CloseReason
	} from 'shared'
	import { version } from '../../../../package.json'

	let missedPings = 0
	let pingInterval: ReturnType<typeof setTimeout>
	let ws: WebSocket

	// TODO: exponentially back this off
	let reconnections = $state(0)
	$effect(() => {
		console.log('Creating connection', reconnections)

		ws = new WebSocket('ws://localhost:8787/session')
		ws.onmessage = (event) => {
			if (event.data === '!') return (missedPings = 0) // ? response is !

			let decoded: DownstreamWsMessage
			try {
				const potentialDownstream = SuperJSON.parse(event.data)
				if (!isDownstreamWsMessage(potentialDownstream))
					return console.error('Invalid message received!\n', event.data)
				decoded = potentialDownstream
			} catch {
				return console.error('Error while parsing message!\n', event.data)
			}

			switch (decoded.action) {
				case DownstreamWsMessageAction.RequireRefresh:
					window.location.reload()
					return
				default:
					console.log('Message did not match a handling case:', decoded)
			}
		}
		ws.onopen = () => {
			ws.send(
				SuperJSON.stringify({
					action: UpstreamWsMessageAction.Hello,
					version
				} satisfies UpstreamWsMessage)
			)
			pingInterval = setInterval(() => {
				if (ws.readyState === ws.OPEN && pingInterval) ws.send('?')
				missedPings++
				console.debug('Sent ping - missed', missedPings)
			}, 2500)
			missedPings = 0
			for (const message of messageQueue) {
				ws.send(SuperJSON.stringify(message))
			}
		}
		ws.onerror = () => reconnections++
		ws.onclose = (event) => {
			switch (event.code) {
				case CloseReason.SchemaNotSatisfied:
					// TODO: Tell the user that the app is doing something odd
					return
				default:
					// Give this socket another go!
					reconnections++
			}
		}

		return () => {
			try {
				ws.onmessage = () => {}
				ws.onopen = () => {}
				ws.onerror = () => {}
				ws.onclose = () => {}
				ws.close(CloseReason.PingsMissed)
			} catch {}
		}
	})

	let messageQueue: ReliableUpstreamWsMessage[] = []
	function sendReliably(message: ReliableUpstreamWsMessage) {
		messageQueue.push(message)
		if (ws.readyState === ws.OPEN) ws.send(SuperJSON.stringify(message))
	}
</script>

<ChatRoot {sendReliably} />
