import { z } from 'zod/v4'
import { ModelProviders } from './ModelProviders'
import { ReasoningLevel } from '../ReasoningLevel'
import { AILab } from './AILab'
import { FileCategory } from './FileCategory'
import validateSemver from 'semver/functions/valid'

export const GlobalConfigSchema = z.object({
	models: z.record(
		z.uuidv7(),
		z.object({
			provider: z.enum(ModelProviders),
			lab: z.enum(AILab),
			provideSearchTool: z.boolean(),
			configurableReasoningLevels: z.array(z.enum(ReasoningLevel)),
			providerModelName: z.string(),
			contextWindow: z.number().int(),
			processableFileInputs: z.array(z.enum(FileCategory)),
			name: z.string(),
			description: z.string(),
			deprecated: z.boolean()
		})
	),
	version: z.object({
		current: z.string().refine(validateSemver),
		suggestReloadBefore: z.string().refine(validateSemver),
		requireReloadBefore: z.string().refine(validateSemver)
	})
})
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>
export const isGlobalConfig = (obj: unknown): obj is GlobalConfig =>
	GlobalConfigSchema.safeParse(obj).success
