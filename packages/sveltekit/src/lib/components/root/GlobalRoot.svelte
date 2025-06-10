<script lang="ts">
	import SuperJSON from 'superjson'
	import ChatRoot from './ChatRoot.svelte'
	import {
		isDownstreamWsMessage,
		type DownstreamWsMessage
	} from 'shared/src/types/ws/downstream/DownstreamWsMessage'
	import { type UpstreamWsMessage } from 'shared/src/types/ws/upstream/UpstreamWsMessage'
	import { UpstreamWsMessageAction } from 'shared/src/types/ws/upstream/UpstreamWsMessageAction'
	import { version } from '../../../../package.json'
	import { DownstreamWsMessageAction } from 'shared/src/types/ws/downstream/DownstreamWsMessageAction'

	let missedPings = 0
	let pingInterval: ReturnType<typeof setTimeout>

	let ws: WebSocket
	$effect(() => {
		ws = new WebSocket('ws://localhost:8787/session')
		ws.onmessage = (event) => {
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
				case DownstreamWsMessageAction.Pong:
					missedPings = 0
					return
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
				if (ws.readyState === ws.OPEN && pingInterval)
					ws.send(
						SuperJSON.stringify({
							action: UpstreamWsMessageAction.Ping
						} satisfies UpstreamWsMessage)
					)
				missedPings++
			}, 2500)
			missedPings = 1
		}
		ws.onerror = console.error // TODO: better error handler
		ws.onclose = console.error // TODO: better close handler
	})
</script>

<ChatRoot />
