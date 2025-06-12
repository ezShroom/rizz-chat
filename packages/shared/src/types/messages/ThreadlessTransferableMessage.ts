import type z from 'zod/v4'
import { BaseTransferableMessageSchema } from './BaseTransferableMessage'

export const ThreadlessTransferableMessageSchema = BaseTransferableMessageSchema.omit({
	thread: true
})
export type ThreadlessTransferableMessage = z.infer<typeof ThreadlessTransferableMessageSchema>
export const isThreadlessTransferableMessage = (
	obj: unknown
): obj is ThreadlessTransferableMessage =>
	ThreadlessTransferableMessageSchema.safeParse(obj).success
