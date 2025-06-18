<script lang="ts">
	import clsx from 'clsx'
	import type { Snippet } from 'svelte'
	import { Pencil, Trash } from 'svelte-bootstrap-icons'

	const {
		selected,
		children,
		onclick
	}: { selected: boolean; children: Snippet; onclick?: () => unknown } = $props()
</script>

<button
	class={clsx(
		'flex h-[42px] w-full cursor-pointer justify-center gap-2 rounded-xl border p-2 text-left transition-all hover:scale-95 hover:bg-stone-900',
		selected && 'border-stone-800 bg-stone-950',
		!selected && 'border-transparent'
	)}
	{onclick}
	><div class="grow truncate">
		<!--<div class="absolute right-0 z-10 size-4 h-full bg-gradient-to-r from-black/0 to-black"></div>-->
		{@render children?.()}
	</div>
	<Pencil class="my-auto flex-none" />
	<Trash class="my-auto flex-none" />
</button>
