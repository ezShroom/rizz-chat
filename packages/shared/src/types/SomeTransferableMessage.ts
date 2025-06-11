import z from 'zod/v4'
import { BaseTransferableMessageSchema } from './BaseTransferableMessage'
import { ThreadlessTransferableMessageSchema } from './ThreadlessTransferableMessage'

export const SomeTransferableMessageSchema = z.union([
	BaseTransferableMessageSchema,
	ThreadlessTransferableMessageSchema
])
export type SomeTransferableMessage = z.infer<typeof SomeTransferableMessageSchema>
export const isSomeTransferableMessage = (obj: unknown): obj is SomeTransferableMessage =>
	SomeTransferableMessageSchema.safeParse(obj).success
