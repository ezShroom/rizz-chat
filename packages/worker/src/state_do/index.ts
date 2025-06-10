import { DurableObject } from 'cloudflare:workers'

export class UserStateDO extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env)

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
		_ws: WebSocket,
		message: string | ArrayBuffer
	): Promise<void> {
		console.log(message)
	}

	public hello() {
		return 'May I object? :)'
	}
}
