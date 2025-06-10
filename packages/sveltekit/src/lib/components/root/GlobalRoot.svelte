<script>
	import ChatRoot from './ChatRoot.svelte'

	let ws
	$effect(() => {
		ws = new WebSocket('ws://localhost:8787/session')
		ws.onmessage = (event) => {
			console.log(event.data)
		}
	})
</script>

<ChatRoot />
