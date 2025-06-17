import { z } from 'zod/v4'
import { DownstreamAnySyncMessageAction } from './DownstreamAnySyncMessageAction'
import { LocalCacheThreadSchema,LocalCacheMessageSchema } from 'shared'

export const DownstreamBridgeMessageSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(DownstreamAnySyncMessageAction.LocalDatabaseError)
	}),
	z.object({
		action: z.literal(DownstreamAnySyncMessageAction.ReloadImmediately)
	}),
	z.object({
		action: z.literal(DownstreamAnySyncMessageAction.InitialData),
		responseTo: z.uuidv4(),
		threads: z.array(LocalCacheThreadSchema),
		requestedThreadMessages: z.array(LocalCacheMessageSchema).optional()
	}),
	z.object({
		action: z.literal(DownstreamAnySyncMessageAction.NewLeaderSoPleaseSprayQueuedMessages)
	})
])
export type DownstreamBridgeMessage = z.infer<typeof DownstreamBridgeMessageSchema>
export const isDownstreamBridgeMessage = (obj: unknown): obj is DownstreamBridgeMessage =>
	DownstreamBridgeMessageSchema.safeParse(obj).success
