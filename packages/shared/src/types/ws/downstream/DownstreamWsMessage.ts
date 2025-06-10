import { z } from 'zod/v4'
import { DownstreamWsMessageAction } from './DownstreamWsMessageAction'

export const DownstreamWsMessageSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(DownstreamWsMessageAction.RequireRefresh)
	}),
	z.object({
		action: z.literal(DownstreamWsMessageAction.NoChangesToReport)
	})
])
export type DownstreamWsMessage = z.infer<typeof DownstreamWsMessageSchema>
export const isDownstreamWsMessage = (obj: unknown): obj is DownstreamWsMessage =>
	DownstreamWsMessageSchema.safeParse(obj).success
