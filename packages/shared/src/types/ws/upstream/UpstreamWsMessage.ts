import { z } from 'zod/v4'
import { UpstreamWsMessageAction } from './UpstreamWsMessageAction'
import validateSemver from 'semver/functions/valid'
import { SomeTransferableMessageSchema } from '../../messages/SomeTransferableMessage'

export const UpstreamWsMessageSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(UpstreamWsMessageAction.Hello),
		version: z.string().refine(validateSemver)
	}),
	z.object({
		action: z.literal(UpstreamWsMessageAction.Submit),
		message: SomeTransferableMessageSchema,
		respondTo: z.uuidv4()
	}),
	z.object({ action: z.literal(UpstreamWsMessageAction.ClaimSuperiority) }),
	z.object({
		action: z.literal(UpstreamWsMessageAction.GiveThreadsAndPossiblyMessages),
		messagesFromThread: z.uuid().optional(),
		respondTo: z.uuidv4()
	})
])
export type UpstreamWsMessage = z.infer<typeof UpstreamWsMessageSchema>
export const isUpstreamWsMessage = (obj: unknown): obj is UpstreamWsMessage =>
	UpstreamWsMessageSchema.safeParse(obj).success
