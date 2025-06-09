<script>
	import AuthSettingsButton from '$lib/components/nav/AuthSettingsButton.svelte'
	import ChatListItem from '$lib/components/nav/ChatListItem.svelte'
</script>

<nav class="flex w-64 flex-col gap-2 border-r border-r-stone-900 bg-black p-4 text-white">
	<h1 class="text-3xl">rizz chat</h1>
	<div
		class="scrollbar-thin scrollbar-thumb-black scrollbar-hover:scrollbar-thumb-stone-600 scrollbar-track-black scrollbar-thumb-rounded-full min-h-0 grow overflow-y-auto transition-all"
		style="overflow-anchor: none"
	>
		<ChatListItem selected={true}>name</ChatListItem>
		<ChatListItem selected={false}>name</ChatListItem>
		<ChatListItem selected={false}>name</ChatListItem>
		<ChatListItem selected={false}>name</ChatListItem>
		<ChatListItem selected={false}>name</ChatListItem><ChatListItem selected={false}
			>name</ChatListItem
		>
		<ChatListItem selected={false}>name</ChatListItem><ChatListItem selected={false}
			>name</ChatListItem
		>
		<ChatListItem selected={false}>name</ChatListItem><ChatListItem selected={false}
			>name</ChatListItem
		>
		<ChatListItem selected={false}>name</ChatListItem><ChatListItem selected={false}
			>name</ChatListItem
		>
		<ChatListItem selected={false}>name</ChatListItem><ChatListItem selected={false}
			>name</ChatListItem
		>
		<ChatListItem selected={false}>name</ChatListItem><ChatListItem selected={false}
			>name</ChatListItem
		>
		<ChatListItem selected={false}>name</ChatListItem><ChatListItem selected={false}
			>name</ChatListItem
		>
		<ChatListItem selected={false}>name</ChatListItem><ChatListItem selected={false}
			>name</ChatListItem
		>
		<ChatListItem selected={false}>name</ChatListItem><ChatListItem selected={false}
			>name</ChatListItem
		>
		<ChatListItem selected={false}>name</ChatListItem><ChatListItem selected={false}
			>name</ChatListItem
		>
		<ChatListItem selected={false}>name</ChatListItem>
	</div>
	<AuthSettingsButton />
</nav>
