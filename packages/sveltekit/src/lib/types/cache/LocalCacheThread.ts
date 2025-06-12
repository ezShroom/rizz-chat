import { z } from 'zod/v4'

export const LocalCacheThreadSchema = z.object({
	title: z.string(),
	id: z.string(),
	lastModified: z.date()
})
export type LocalCacheThread = z.infer<typeof LocalCacheThreadSchema>
export const isLocalCacheThread = (obj: unknown): obj is LocalCacheThread =>
	LocalCacheThreadSchema.safeParse(obj).success
