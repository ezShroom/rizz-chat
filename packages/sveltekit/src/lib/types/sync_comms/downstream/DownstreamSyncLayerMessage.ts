import { z } from 'zod/v4'
import { DownstreamBridgeMessageSchema } from './DownstreamBridgeMessage'

export const DownstreamSyncLayerMessageSchema = z.intersection(DownstreamBridgeMessageSchema, z.object({ id: z.uuidv4() }))
export type DownstreamSyncLayerMessage = z.infer<typeof DownstreamSyncLayerMessageSchema>
export const isDownstreamSyncLayerMessage = (obj: unknown): obj is DownstreamSyncLayerMessage =>
	DownstreamSyncLayerMessageSchema.safeParse(obj).success
