<script>
	import ChatRoot from './ChatRoot.svelte'

	let ws
	$effect(() => {
		ws = new WebSocket('ws://localhost:8787/session')
	})
</script>

<ChatRoot />
