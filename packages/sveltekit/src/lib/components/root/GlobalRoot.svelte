<script lang="ts">
	import ChatRoot from './ChatRoot.svelte'
	import { syncLayer } from '$lib/sync_layer/index.svelte'
	$effect(() => console.log(syncLayer))
	const appState = syncLayer.data
</script>

<ChatRoot {appState} />
