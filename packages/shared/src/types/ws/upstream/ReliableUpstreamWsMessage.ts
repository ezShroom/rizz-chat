import z from 'zod/v4'
import { UpstreamWsMessageSchema } from './UpstreamWsMessage'

export const ReliableUpstreamWsMessageSchema = z.intersection(
	UpstreamWsMessageSchema,
	z.object({ respondTo: z.uuidv4() })
)
export type ReliableUpstreamWsMessage = z.infer<typeof ReliableUpstreamWsMessageSchema>
export const isReliableUpstreamWsMessage = (obj: unknown): obj is ReliableUpstreamWsMessage =>
	ReliableUpstreamWsMessageSchema.safeParse(obj).success
