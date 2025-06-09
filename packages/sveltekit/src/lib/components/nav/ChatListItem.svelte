<script lang="ts">
	import clsx from 'clsx'
	import type { Snippet } from 'svelte'

	const {
		selected,
		children,
		onclick
	}: { selected: boolean; children: Snippet; onclick?: () => unknown } = $props()
</script>

<button
	class={clsx(
		'flex w-full cursor-pointer justify-center gap-2 rounded-xl border p-2 transition-all hover:scale-95 hover:bg-stone-900',
		selected && 'border-stone-800 bg-stone-950',
		!selected && 'border-transparent'
	)}
	{onclick}
	>{@render children?.()}
</button>
