import z from 'zod/v4'

export const WorkerEnvSchema = z.object({
	PUBLIC_SESSION_SERVER_ORIGIN: z.string(),
	dev: z.boolean()
})
export type WorkerEnv = z.infer<typeof WorkerEnvSchema>
export const isWorkerEnv = (obj: unknown): obj is WorkerEnv =>
	WorkerEnvSchema.safeParse(obj).success
