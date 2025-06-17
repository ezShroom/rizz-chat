<script lang="ts">
	import Navigation from './chat/Navigation.svelte'
	import ChatPane from './chat/ChatPane.svelte'
	import type { AppState } from '$lib/sync_layer/index.svelte'

	const { appState }: { appState: AppState } = $props()
</script>

<div class="flex h-screen overflow-hidden">
	<Navigation {appState} />
	<ChatPane />
</div>
