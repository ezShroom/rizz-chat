import { AILab } from './types/app_config/AILab'
import { FileCategory } from './types/app_config/FileCategory'
import type { GlobalConfig } from './types/app_config/GlobalConfig'
import { ModelProviders } from './types/app_config/ModelProviders'
import { ReasoningLevel } from './types/ReasoningLevel'
import { version } from '../package.json'

export const globalConfig: GlobalConfig = {
	models: {
		'0197601d-574b-7bfb-87df-cd91c27ca542': {
			providerModelName: 'meta-llama/llama-4-scout-17b-16e-instruct',
			provider: ModelProviders.Groq,
			lab: AILab.Meta,
			name: 'Llama 4 Scout',
			description: 'A relatively small, relatively limited open source multimodal model.',
			provideSearchTool: true,
			configurableReasoningLevels: [ReasoningLevel.Off],
			processableFileInputs: [FileCategory.Image],
			contextWindow: 128_000,
			deprecated: false
		}
	},
	version: {
		current: version,
		suggestReloadBefore: '0.0.1',
		requireReloadBefore: '0.0.1'
	}
}
