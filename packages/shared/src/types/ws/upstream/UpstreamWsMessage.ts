import { z } from 'zod/v4'
import { UpstreamWsMessageAction } from './UpstreamWsMessageAction'
import semver from 'semver'

export const UpstreamWsMessageSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(UpstreamWsMessageAction.Hello),
		version: z.string().refine(semver.valid)
	})
])
export type UpstreamWsMessage = z.infer<typeof UpstreamWsMessageSchema>
export const isUpstreamWsMessage = (obj: unknown): obj is UpstreamWsMessage =>
	UpstreamWsMessageSchema.safeParse(obj).success
