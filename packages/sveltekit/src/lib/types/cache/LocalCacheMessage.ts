import { ModelConfigSchema } from 'shared'
import { z } from 'zod/v4'

export const LocalCacheMessageSchema = z.object({
	modelConfig: ModelConfigSchema,
	body: z.string(),
	id: z.uuid(),
	sent: z.date()
})
export type LocalCacheMessage = z.infer<typeof LocalCacheMessageSchema>
export const isLocalCacheMessage = (obj: unknown): obj is LocalCacheMessage =>
	LocalCacheMessageSchema.safeParse(obj).success
