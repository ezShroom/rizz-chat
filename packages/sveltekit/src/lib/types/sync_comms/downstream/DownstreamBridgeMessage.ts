import { z } from 'zod/v4'
import { DownstreamAnySyncMessageAction } from './DownstreamAnySyncMessageAction'

export const DownstreamBridgeMessageSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(DownstreamAnySyncMessageAction.LocalDatabaseError)
	})
])
export type DownstreamBridgeMessage = z.infer<typeof DownstreamBridgeMessageSchema>
export const isDownstreamBridgeMessage = (obj: unknown): obj is DownstreamBridgeMessage =>
	DownstreamBridgeMessageSchema.safeParse(obj).success
