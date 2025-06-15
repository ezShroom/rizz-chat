import { z } from 'zod/v4'
import { DownstreamAnySyncMessageAction } from './DownstreamAnySyncMessageAction'
import { LocalCacheThreadSchema } from '$lib/types/cache/LocalCacheThread'
import { LocalCacheMessageSchema } from '$lib/types/cache/LocalCacheMessage'

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
	})
])
export type DownstreamBridgeMessage = z.infer<typeof DownstreamBridgeMessageSchema>
export const isDownstreamBridgeMessage = (obj: unknown): obj is DownstreamBridgeMessage =>
	DownstreamBridgeMessageSchema.safeParse(obj).success
