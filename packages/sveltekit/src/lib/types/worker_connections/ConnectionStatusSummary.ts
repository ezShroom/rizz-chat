import { z } from 'zod/v4'
import { DbStatus } from './DbStatus'
import { WsStatus } from './WsStatus'

export const ConnectionStatusSummarySchema = z.object({
	db: z.enum(DbStatus),
	ws: z.enum(WsStatus)
})
export type ConnectionStatusSummary = z.infer<typeof ConnectionStatusSummarySchema>
export const isConnectionStatusSummary = (obj: unknown): obj is ConnectionStatusSummary =>
	ConnectionStatusSummarySchema.safeParse(obj).success
