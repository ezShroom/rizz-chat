import { z } from 'zod/v4'
import { UpstreamAnySyncMessageAction } from './UpstreamAnySyncMessageAction'
import { WorkerEnvSchema } from '../WorkerEnv'

export const UpstreamBridgeMessageSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(UpstreamAnySyncMessageAction.EnsureInit),
		env: WorkerEnvSchema
	}),
	z.object({
		action: z.literal(UpstreamAnySyncMessageAction.GiveInitialData),
		includeMessagesFrom: z.uuid().optional()
	})
])
export type UpstreamBridgeMessage = z.infer<typeof UpstreamBridgeMessageSchema>
export const isUpstreamBridgeMessage = (obj: unknown): obj is UpstreamBridgeMessage =>
	UpstreamBridgeMessageSchema.safeParse(obj).success
