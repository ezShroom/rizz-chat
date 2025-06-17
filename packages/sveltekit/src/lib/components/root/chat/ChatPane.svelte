<script lang="ts">
	import ChatBar from '$lib/components/chat_pane/ChatBar.svelte'
	import { UpstreamWsMessageAction, type ReliableUpstreamWsMessage } from 'shared'

	/*const {
		message,
		sendReliably
	}: { message: string; sendReliably: (obj: ReliableUpstreamWsMessage) => unknown } = $props()*/
</script>

<main class="flex grow flex-col bg-stone-950 text-white">
	<div
		class="scrollbar-thin scrollbar-thumb-stone-950 scrollbar-hover:scrollbar-thumb-stone-600 scrollbar-track-stone-950 scrollbar-thumb-rounded-full mx-auto min-h-0 w-full max-w-256 grow overflow-y-auto p-4"
	>
		<div class="flex w-full justify-end">
			<div class="max-w-128 rounded-xl rounded-br-none bg-stone-900 p-4">What is Rizz Chat?</div>
		</div>
		<div class="p-4">Rizz Chat is the best!</div>
		<div class="p-4 break-words">aaa</div>
	</div>
	<ChatBar />
</main>
