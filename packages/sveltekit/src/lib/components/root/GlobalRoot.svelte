<script lang="ts">
	import ChatRoot from './ChatRoot.svelte'
	import { syncLayer } from '$lib/sync_layer'
	$effect(() => console.log(syncLayer))
</script>

<ChatRoot />
