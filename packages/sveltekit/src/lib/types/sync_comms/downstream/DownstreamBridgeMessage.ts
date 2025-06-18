import { z } from 'zod/v4'
import { DownstreamAnySyncMessageAction } from './DownstreamAnySyncMessageAction'
import { LocalCacheThreadSchema, LocalCacheMessageSchema } from 'shared'

export const DownstreamBridgeMessageSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(DownstreamAnySyncMessageAction.LocalDatabaseError)
	}),
	z.object({
		action: z.literal(DownstreamAnySyncMessageAction.ReloadImmediately)
	}),
	z.object({
		action: z.literal(DownstreamAnySyncMessageAction.InitialData),
		threads: z.array(LocalCacheThreadSchema),
		id: z.uuidv4(),
		requestedThreadMessages: z.array(LocalCacheMessageSchema).optional()
	}),
	z.object({
		action: z.literal(DownstreamAnySyncMessageAction.NewLeaderSoPleaseSprayQueuedMessages)
	}),
	z.object({ action: z.literal(DownstreamAnySyncMessageAction.NetworkIssueBootedSyncLayer) }),
	z.object({
		action: z.literal(DownstreamAnySyncMessageAction.ThreadsMutation),
		threads: z.array(LocalCacheThreadSchema)
	})
])
export type DownstreamBridgeMessage = z.infer<typeof DownstreamBridgeMessageSchema>
export const isDownstreamBridgeMessage = (obj: unknown): obj is DownstreamBridgeMessage =>
	DownstreamBridgeMessageSchema.safeParse(obj).success
