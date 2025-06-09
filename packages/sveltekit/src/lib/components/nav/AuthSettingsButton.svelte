<script lang="ts">
	import { Person } from 'svelte-bootstrap-icons'
	import { authClient } from '$lib/auth-client'
	import clsx from 'clsx'
	const session = authClient.useSession()
</script>

<button
	class={clsx(
		'flex w-full cursor-pointer justify-center gap-2 rounded-xl border p-2 transition-all hover:scale-95',
		!$session.data && 'border-amber-800 bg-amber-950 hover:border-amber-700 hover:bg-amber-900',
		$session.data && 'flex border-stone-800 bg-stone-950'
	)}
	onclick={() => authClient.signIn.social({ provider: 'discord' })}
>
	{#if $session.data}
		<img
			src={$session.data.user.image ??
				`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${$session.data.user.id}`}
			class="my-auto aspect-square size-10 rounded-lg"
			alt="User avatar"
		/>
		<div class="grow text-left">
			<h2>{$session.data.user.name}</h2>
			<p class="text-xs">Basic</p>
		</div>
	{:else}
		<Person class="my-auto" /> Log in
	{/if}
</button>
