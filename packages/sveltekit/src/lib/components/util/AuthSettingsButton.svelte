<script>
	import { Person } from 'svelte-bootstrap-icons'
	import { authClient } from '$lib/auth-client'
</script>

<button
	class="flex w-full justify-center gap-2 rounded-xl border border-amber-800 bg-amber-950 p-2 transition-all hover:scale-95 hover:border-amber-700 hover:bg-amber-900"
	onclick={() => authClient.signIn.social({ provider: 'discord' })}
>
	<Person class="my-auto" /> Log in
</button>
