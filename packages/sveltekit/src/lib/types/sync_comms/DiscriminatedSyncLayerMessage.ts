import { z } from 'zod/v4'
import { Superiority } from './Superiority'
import { UpstreamSyncLayerMessageSchema } from './upstream/UpstreamSyncLayerMessage'
import { DownstreamBridgeMessageSchema } from './downstream/DownstreamBridgeMessage'

export const DiscriminatedSyncLayerMessageSchema = z.discriminatedUnion('for', [
	z.object({
		for: z.literal(Superiority.Follower),
		message: DownstreamBridgeMessageSchema
	}),
	z.object({
		for: z.literal(Superiority.Leader),
		message: UpstreamSyncLayerMessageSchema
	})
])
export type DiscriminatedSyncLayerMessage = z.infer<typeof DiscriminatedSyncLayerMessageSchema>
export const isDiscriminatedSyncLayerMessage = (
	obj: unknown
): obj is DiscriminatedSyncLayerMessage =>
	DiscriminatedSyncLayerMessageSchema.safeParse(obj).success
