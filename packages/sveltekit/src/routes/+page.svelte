<script lang="ts">
	type Message = {
		source: 'user' | 'agent'
		content: string
		id: string
	}

	const messages: Message[] = $state([])
	let currentDraftMessage = $state('')

	async function submit() {
		const messageToSend = currentDraftMessage
		currentDraftMessage = ''
		let content = ''

		messages.push({ source: 'user', content: messageToSend, id: crypto.randomUUID() })
		const something = await fetch('http://localhost:8787/')

		if (!something.body) {
			throw new Error('Response has no body')
		}

		const reader = something.body.getReader()
		const decoder = new TextDecoder()

		while (true) {
			const { value, done } = await reader.read()
			if (done) {
				break
			}
			const decodedChunk = decoder.decode(value, { stream: true })

			// the vercel ai sdk often prefixes chunks with a digit and a colon, e.g., `0:"Hello"`.
			// you might need to parse this if you see weird prefixes in your output.
			// for a simple text stream, this is enough:
			content += decodedChunk
			console.log(content)
		}
	}
</script>

{#each messages as message}
	<p>{message.source}</p>
	<p>{message.content}</p>
{/each}
<input type="text" name="message" id="message" bind:value={currentDraftMessage} /><button
	onclick={submit}>send</button
>
