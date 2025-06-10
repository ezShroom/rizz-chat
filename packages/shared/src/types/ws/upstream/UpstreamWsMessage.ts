import { z } from 'zod/v4'
import { UpstreamWsMessageAction } from './UpstreamWsMessageAction'
import semver from 'semver'
import { ReasoningLevel } from '../../ReasoningLevel'

export const UpstreamWsMessageSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(UpstreamWsMessageAction.Hello),
		version: z.string().refine(semver.valid)
	}),
	z.object({
		action: z.literal(UpstreamWsMessageAction.Submit),
		thread: z.uuidv7(),
		attachments: z.array(z.url()).optional(),
		body: z.string().max(10_000),
		model: z.uuidv7(),
		reasoningLevel: z.enum(ReasoningLevel),
		search: z.boolean()
	})
])
export type UpstreamWsMessage = z.infer<typeof UpstreamWsMessageSchema>
export const isUpstreamWsMessage = (obj: unknown): obj is UpstreamWsMessage =>
	UpstreamWsMessageSchema.safeParse(obj).success
