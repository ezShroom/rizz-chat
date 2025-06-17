import { z } from 'zod/v4'
import { DownstreamWsMessageAction } from './DownstreamWsMessageAction'

export const DownstreamWsMessageSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(DownstreamWsMessageAction.RequireRefresh)
	}),
	z.object({
		action: z.literal(DownstreamWsMessageAction.SuggestRefresh)
	}),
	z.object({
		action: z.literal(DownstreamWsMessageAction.NoChangesToReport)
	}),
	z.object({
		action: z.literal(DownstreamWsMessageAction.MessageSent),
		responseTo: z.uuidv4(),
		id: z.uuidv7(),
		newThreadDetails: z
			.object({
				id: z.uuid(),
				createdAt: z.date()
			})
			.optional()
	}),
	z.object({
		action: z.literal(DownstreamWsMessageAction.NewMessageToken),
		messageId: z.uuidv7(),
		content: z.string(),
		position: z.number()
	})
])
export type DownstreamWsMessage = z.infer<typeof DownstreamWsMessageSchema>
export const isDownstreamWsMessage = (obj: unknown): obj is DownstreamWsMessage =>
	DownstreamWsMessageSchema.safeParse(obj).success
