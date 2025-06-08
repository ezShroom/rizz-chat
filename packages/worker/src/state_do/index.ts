export class UserStateDO extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env)

		console.log('we have Constructed very hard')
	}
}
