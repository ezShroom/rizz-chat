<script>
	import { ArrowUp } from 'svelte-bootstrap-icons'
	import Navigation from './chat/Navigation.svelte'
	import ChatBar from '../chat_pane/ChatBar.svelte'
</script>

<div class="flex h-screen">
	<Navigation />
	<main class="flex grow flex-col bg-stone-950 text-white">
		<div class="mx-auto size-full max-w-256 grow p-4">
			<div class="flex w-full justify-end">
				<div class="max-w-128 rounded-xl rounded-br-none bg-stone-900 p-4">What is Rizz Chat?</div>
			</div>
			<div class="p-4">Rizz Chat is the best!</div>
		</div>
		<ChatBar />
	</main>
</div>
