import { z } from 'zod/v4'
import { UpstreamBridgeMessageSchema } from './UpstreamBridgeMessage'

export const UpstreamSyncLayerMessageSchema = z.intersection(
	UpstreamBridgeMessageSchema,
	z.object({ id: z.uuidv4() })
)
export type UpstreamSyncLayerMessage = z.infer<typeof UpstreamSyncLayerMessageSchema>
export const isUpstreamSyncLayerMessage = (obj: unknown): obj is UpstreamSyncLayerMessage =>
	UpstreamSyncLayerMessageSchema.safeParse(obj).success
