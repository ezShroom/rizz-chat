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

	let ws: WebSocket
	$effect(() => {
		ws = new WebSocket('ws://localhost:8787/session')
		ws.onmessage = (event) => {
			try {
				const message: DownstreamWsMessage = SuperJSON.parse(event.data)
				if (!isDownstreamWsMessage(message))
					return console.error('Invalid message received!\n', event.data)
			} catch {}
		}
		ws.onopen = (event) =>
			ws.send(
				SuperJSON.stringify({
					action: UpstreamWsMessageAction.Hello,
					version
				} satisfies UpstreamWsMessage)
			)
		ws.onerror = console.error // TODO: better error handler
		ws.onclose = console.error // TODO: better close handler
	})
</script>

<ChatRoot />
