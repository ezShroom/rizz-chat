import { z } from 'zod/v4'
import { ModelConfigSchema } from './ModelConfig'
import { MAX_MESSAGE_LENGTH } from '../constants'

export const TransferableMessageSchema = z.object({
	thread: z.uuidv7(),
	attachments: z.array(z.url()).optional(),
	body: z.string().max(MAX_MESSAGE_LENGTH),
	modelConfig: ModelConfigSchema
})
export type TransferableMessage = z.infer<typeof TransferableMessageSchema>
export const isTransferableMessage = (obj: unknown): obj is TransferableMessage =>
	TransferableMessageSchema.safeParse(obj).success
