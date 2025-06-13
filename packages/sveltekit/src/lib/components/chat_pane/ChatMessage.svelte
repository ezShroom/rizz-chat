<script lang="ts">
	const { message, userSent }: { message: string; userSent: boolean } = $props()
</script>

{#if userSent}
	<div class="flex w-full justify-end">
		<div class="max-w-128 rounded-xl rounded-br-none bg-stone-900 p-4 break-words">{message}</div>
	</div>
{:else}
	<div class="p-4 break-words">{message}</div>
{/if}
