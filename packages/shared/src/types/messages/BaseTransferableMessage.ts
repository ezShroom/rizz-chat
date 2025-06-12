import { z } from 'zod/v4'
import { ModelConfigSchema } from './ModelConfig'
import { MAX_MESSAGE_LENGTH } from '../../constants'

export const BaseTransferableMessageSchema = z.object({
	thread: z.uuidv7(),
	attachments: z.array(z.url()).optional(),
	body: z.string().max(MAX_MESSAGE_LENGTH),
	modelConfig: ModelConfigSchema
})
export type BaseTransferableMessage = z.infer<typeof BaseTransferableMessageSchema>
export const isBaseTransferableMessage = (obj: unknown): obj is BaseTransferableMessage =>
	BaseTransferableMessageSchema.safeParse(obj).success
