import { z } from 'zod/v4'
import { ReasoningLevel } from '../ReasoningLevel'

export const ModelConfigSchema = z.object({
	model: z.uuidv7(),
	reasoningLevel: z.enum(ReasoningLevel),
	search: z.boolean()
})
export type ModelConfig = z.infer<typeof ModelConfigSchema>
export const isModelConfig = (obj: unknown): obj is ModelConfig =>
	ModelConfigSchema.safeParse(obj).success
