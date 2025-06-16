import { z } from 'zod/v4'
import { UpstreamAnySyncMessageAction } from './UpstreamAnySyncMessageAction'

export const UpstreamBridgeMessageSchema = 
export type UpstreamBridgeMessage = z.infer<typeof UpstreamBridgeMessageSchema>
export const isUpstreamBridgeMessage = (obj: unknown): obj is UpstreamBridgeMessage =>
	UpstreamBridgeMessageSchema.safeParse(obj).success
