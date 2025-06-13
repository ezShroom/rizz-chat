<script lang="ts">
	import Navigation from './chat/Navigation.svelte'
	import ChatBar from '../chat_pane/ChatBar.svelte'
	import { UpstreamWsMessageAction, type ReliableUpstreamWsMessage } from 'shared'
	import type { MemoryCache } from '$lib/types/cache/MemoryCache'
	import ChatPane from './chat/ChatPane.svelte'

	const {
		sendReliably,
		memoryCache,
		message
	}: {
		sendReliably: (message: ReliableUpstreamWsMessage) => unknown
		memoryCache: MemoryCache
		message: string
	} = $props()
</script>

<div class="flex h-screen overflow-hidden">
	<Navigation threadCache={memoryCache.threads} />
	<ChatPane {sendReliably} {message} />
</div>
