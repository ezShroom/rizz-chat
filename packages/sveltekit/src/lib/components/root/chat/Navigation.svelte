<script lang="ts">
	import AuthSettingsButton from '$lib/components/nav/AuthSettingsButton.svelte'
	import ChatListItem from '$lib/components/nav/ChatListItem.svelte'
	import type { LocalCacheThread } from '$lib/types/cache/LocalCacheThread'

	const { threadCache }: { threadCache: LocalCacheThread[] } = $props()
	const sortedCache = $derived(
		[...threadCache].sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime())
	)
</script>

<nav
	class="flex w-64 shrink-0 flex-col gap-2 border-r border-r-stone-900 bg-black p-4 pr-0 text-white"
>
	<h1 class="pr-4 text-3xl">rizz chat</h1>
	<div
		class="scrollbar-thin scrollbar-thumb-black scrollbar-hover:scrollbar-thumb-stone-600 scrollbar-track-black scrollbar-thumb-rounded-full min-h-0 grow overflow-y-auto pr-2 transition-all"
		style="overflow-anchor: none"
	>
		{#each sortedCache as cachedThread (cachedThread.id)}
			<ChatListItem selected={false}>{cachedThread.title}</ChatListItem>
		{/each}
	</div>
	<AuthSettingsButton />
</nav>
