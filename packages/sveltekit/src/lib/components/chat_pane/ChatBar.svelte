<script lang="ts">
	import {
		globalConfig,
		MAX_MESSAGE_LENGTH,
		ReasoningLevel,
		type BaseTransferableMessage
	} from 'shared'
	import { ArrowUp } from 'svelte-bootstrap-icons'

	let textareaElement: HTMLTextAreaElement
	let value = $state('')

	const { onSubmit }: { onSubmit?: (message: BaseTransferableMessage) => unknown } = $props()

	function handleInput() {
		// reset height to its minimum to correctly calculate the new scrollHeight
		textareaElement.style.height = 'auto'
		// set the height to the scrollHeight, which is the height of the content
		textareaElement.style.height = `${textareaElement.scrollHeight}px`
	}
	$effect(() => handleInput())
	function handleKeypress(
		event: KeyboardEvent & {
			currentTarget: EventTarget & HTMLTextAreaElement
		}
	) {
		// check for enter key, but not when shift is pressed (for new lines)
		if (event.key === 'Enter' && !event.shiftKey) {
			// prevent the default action (which is to insert a new line)
			event.preventDefault()
			doSubmission()
		} else handleInput()
	}
	function doSubmission() {
		onSubmit?.({
			thread: '0197601d-574b-7a61-ae1f-badf0a4af1b2',
			body: value,
			modelConfig: {
				model: '0197601d-574b-7bfb-87df-cd91c27ca542',
				reasoningLevel: ReasoningLevel.Off,
				search: false
			}
		})
		value = ''
		requestAnimationFrame(handleInput)
	}
</script>

<div class="flex items-end gap-0 bg-stone-900 p-2">
	<div class="p-2">{Object.values(globalConfig.models)[0].name}</div>
	<textarea
		bind:this={textareaElement}
		bind:value
		oninput={handleInput}
		onkeydown={handleKeypress}
		placeholder="Type your message here..."
		class="max-h-32 grow resize-none appearance-none border-none bg-transparent p-2 outline-none"
		rows="1"
		maxlength={MAX_MESSAGE_LENGTH}
	></textarea>
	<button
		class="ml-2 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-t from-red-800 to-red-700 transition-all hover:scale-90 hover:from-red-900 hover:to-red-800"
		onclick={doSubmission}
	>
		<ArrowUp class="size-5" />
	</button>
</div>
