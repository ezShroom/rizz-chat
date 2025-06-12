<script lang="ts">
	import SuperJSON from 'superjson'
	import ChatRoot from './ChatRoot.svelte'
	import {
		isDownstreamWsMessage,
		type DownstreamWsMessage,
		type ReliableUpstreamWsMessage
	} from 'shared'
	import {
		type UpstreamWsMessage,
		UpstreamWsMessageAction,
		DownstreamWsMessageAction,
		CloseReason
	} from 'shared'
	import { version } from '../../../../package.json'
	import type { MemoryCache } from '$lib/types/cache/MemoryCache'

	let missedPings = 0
	let pingInterval: ReturnType<typeof setInterval>
	let ws: WebSocket

	function clearSocket() {
		ws.onmessage = () => {}
		ws.onopen = () => {}
		ws.onerror = () => {}
		ws.onclose = () => {}
	}
	const memoryCache: MemoryCache = $state({
		threads: [],
		messages: []
	})

	// TODO: exponentially back this off
	let reconnections = $state(0)
	$effect(() => {
		console.log('Creating connection', reconnections)

		ws = new WebSocket('ws://localhost:8787/session')
		ws.onmessage = (event) => {
			if (event.data === '!') return (missedPings = 0) // ? response is !

			let decoded: DownstreamWsMessage
			try {
				const potentialDownstream = SuperJSON.parse(event.data)
				if (!isDownstreamWsMessage(potentialDownstream))
					return console.error('Invalid message received!\n', event.data)
				if ('responseTo' in potentialDownstream) delete messageQueue[potentialDownstream.responseTo]
				decoded = potentialDownstream
			} catch {
				return console.error('Error while parsing message!\n', event.data)
			}

			switch (decoded.action) {
				case DownstreamWsMessageAction.RequireRefresh:
					window.location.reload()
					return
				case DownstreamWsMessageAction.NoChangesToReport:
					// yay
					return
				case DownstreamWsMessageAction.MessageSent:
					if (decoded.newThreadDetails) {
						console.log('aa')
						memoryCache.threads.push({
							title: '',
							id: decoded.newThreadDetails.id,
							lastModified: decoded.newThreadDetails.createdAt
						})
					}
					return
				case DownstreamWsMessageAction.NewMessageToken:
				// this requires some context knowledge, don't push to memory right now

				default:
					console.log('Message did not match a handling case:', decoded)
			}
		}
		ws.onopen = () => {
			ws.send(
				SuperJSON.stringify({
					action: UpstreamWsMessageAction.Hello,
					version
				} satisfies UpstreamWsMessage)
			)
			pingInterval = setInterval(() => {
				if (ws.readyState === ws.OPEN && pingInterval) ws.send('?')
				missedPings++
				console.debug('Sent ping - missed', missedPings)
			}, 2500)
			missedPings = 0
			for (const message of Object.values(messageQueue)) {
				ws.send(SuperJSON.stringify(message))
			}
		}
		ws.onerror = () => {
			clearInterval(pingInterval)
			reconnections++
		}
		ws.onclose = (event) => {
			clearInterval(pingInterval)
			switch (event.code) {
				case CloseReason.SchemaNotSatisfied:
				case CloseReason.BadModelConfig:
					// TODO: Tell the user that the app is doing something odd
					return
				default:
					// Give this socket another go!
					reconnections++
			}
		}

		return () => {
			try {
				clearSocket()
				ws.close(CloseReason.PingsMissed)
			} catch {}
		}
	})

	let messageQueue: Record<string, ReliableUpstreamWsMessage> = {}
	function sendReliably(message: ReliableUpstreamWsMessage) {
		messageQueue[message.respondTo] = message
		if (ws.readyState === ws.OPEN) ws.send(SuperJSON.stringify(message))
	}
</script>

<ChatRoot {sendReliably} {memoryCache} />
