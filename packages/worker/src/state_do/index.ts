import { DurableObject } from 'cloudflare:workers'
import SuperJSON from 'superjson'
import {
	isUpstreamWsMessage,
	type UpstreamWsMessage
} from 'shared/src/types/ws/upstream/UpstreamWsMessage'
import { type DownstreamWsMessage } from 'shared/src/types/ws/downstream/DownstreamWsMessage'
import { UpstreamWsMessageAction } from 'shared/src/types/ws/upstream/UpstreamWsMessageAction'
import { DownstreamWsMessageAction } from 'shared/src/types/ws/downstream/DownstreamWsMessageAction'

export class UserStateDO extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env)

		if (!ctx.getWebSocketAutoResponse())
			ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('?', '!'))

		console.log('we have Constructed very hard')
	}

	public override async fetch(/*request: Request*/) {
		const webSocketPair = new WebSocketPair()
		const [client, server] = Object.values(webSocketPair)
		if (!client || !server)
			return new Response('Could not generate WebSocket pair', { status: 500 })

		this.ctx.acceptWebSocket(server)

		return new Response(null, {
			status: 101,
			webSocket: client
		})
	}

	public override async webSocketMessage(
		ws: WebSocket,
		message: string | ArrayBuffer
	): Promise<void> {
		let decoded: UpstreamWsMessage
		try {
			if (typeof message !== 'string') throw new Error('Socket message is not a string')
			const potentialUpstream = SuperJSON.parse(message)
			if (!isUpstreamWsMessage(potentialUpstream))
				throw new Error('Socket message does not conform to schema')
			decoded = potentialUpstream
		} catch (e) {
			console.error(e)
			ws.close(4000)
			return
		}
		switch (decoded.action) {
			/*case UpstreamWsMessageAction.Ping:
				ws.send(
					SuperJSON.stringify({ action: DownstreamWsMessageAction.Pong } as DownstreamWsMessage)
				)
				return*/
			case UpstreamWsMessageAction.Hello:
				ws.send(
					SuperJSON.stringify({
						action: DownstreamWsMessageAction.NoChangesToReport
					} as DownstreamWsMessage)
				)
				return
			default:
			// assertNever()
		}
	}

	public hello() {
		return 'May I object? :)'
	}
}
