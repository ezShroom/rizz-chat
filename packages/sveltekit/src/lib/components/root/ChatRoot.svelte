<script lang="ts">
	import Navigation from './chat/Navigation.svelte'
	import ChatBar from '../chat_pane/ChatBar.svelte'
	import { UpstreamWsMessageAction, type ReliableUpstreamWsMessage } from 'shared'
	import type { MemoryCache } from '$lib/types/cache/MemoryCache'

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

<div class="flex h-screen">
	<Navigation threadCache={memoryCache.threads} />
	<main class="flex grow flex-col bg-stone-950 text-white">
		<div class="mx-auto size-full max-w-256 grow p-4">
			<div class="flex w-full justify-end">
				<div class="max-w-128 rounded-xl rounded-br-none bg-stone-900 p-4">What is Rizz Chat?</div>
			</div>
			<div class="p-4">Rizz Chat is the best!</div>
			<div class="p-4">{message}</div>
		</div>
		<ChatBar
			onSubmit={(message) =>
				sendReliably({
					action: UpstreamWsMessageAction.Submit,
					message,
					respondTo: crypto.randomUUID()
				})}
		/>
	</main>
</div>
