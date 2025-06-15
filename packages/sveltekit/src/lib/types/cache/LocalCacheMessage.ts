import { ModelConfigSchema, Sender } from 'shared'
import { z } from 'zod/v4'

export const LocalCacheMessageSchema = z.object({
	modelConfig: ModelConfigSchema,
	body: z.string(),
	id: z.uuid(),
	sent: z.date(),
	sender: z.enum(Sender)
})
export type LocalCacheMessage = z.infer<typeof LocalCacheMessageSchema>
export const isLocalCacheMessage = (obj: unknown): obj is LocalCacheMessage =>
	LocalCacheMessageSchema.safeParse(obj).success
