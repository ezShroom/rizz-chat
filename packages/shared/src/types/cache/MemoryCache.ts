import { z } from 'zod/v4'
import { LocalCacheThreadSchema } from './LocalCacheThread'
import { LocalCacheMessageSchema } from './LocalCacheMessage'

export const MemoryCacheSchema = z.object({
	threads: z.array(LocalCacheThreadSchema),
	messages: z.array(LocalCacheMessageSchema)
})
export type MemoryCache = z.infer<typeof MemoryCacheSchema>
export const isMemoryCache = (obj: unknown): obj is MemoryCache =>
	MemoryCacheSchema.safeParse(obj).success
