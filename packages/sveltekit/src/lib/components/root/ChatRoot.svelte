<script>
	import Navigation from './chat/Navigation.svelte'
</script>

<div class="flex h-screen">
	<Navigation />
	<main class="flex grow flex-col bg-stone-950 text-white">
		<div class="mx-auto size-full max-w-256 grow p-4">
			<div class="ml-auto max-w-128 rounded-xl rounded-br-none bg-stone-900 p-4">
				What is Rizz Chat?
			</div>
			<div>Rizz Chat is the best!</div>
		</div>
		<input
			class="appearance-none !border-none bg-stone-900 p-4 !outline-none placeholder:text-stone-400"
			placeholder="Chat with Gemini 2.5 Flash"
		/>
	</main>
</div>
