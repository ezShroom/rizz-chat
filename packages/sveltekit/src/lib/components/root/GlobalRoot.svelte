<script lang="ts">
	import SuperJSON from 'superjson'
	import ChatRoot from './ChatRoot.svelte'
	import {
		isDownstreamWsMessage,
		type DownstreamWsMessage
	} from 'shared/src/types/ws/downstream/DownstreamWsMessage'

	let ws
	$effect(() => {
		ws = new WebSocket('ws://localhost:8787/session')
		ws.onmessage = (event) => {
			const message: DownstreamWsMessage = SuperJSON.parse(event.data)
			if (!isDownstreamWsMessage(message))
				return console.error('Invalid message received!\n', event.data)
		}
	})
</script>

<ChatRoot />
