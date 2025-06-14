import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { MAX_MESSAGE_LENGTH } from '../../constants'
import { relations } from 'drizzle-orm'

export const thread = sqliteTable(
	'thread',
	{
		id: text().primaryKey(),
		title: text(),
		lastKnownModification: integer({ mode: 'timestamp_ms' })
	},
	(table) => [
		index('thread_lastKnownModification_idx').on(table.lastKnownModification),
		index('thread_title+lastKnownModification_idx').on(table.title, table.lastKnownModification)
	]
)
export const message = sqliteTable(
	'message',
	{
		id: text().primaryKey(),
		threadId: text().references(() => thread.id, { onDelete: 'cascade' }),
		createdAt: integer({ mode: 'timestamp_ms' }),
		body: text({ length: MAX_MESSAGE_LENGTH }),
		model: text(),
		reasoningLevel: integer(),
		search: integer({ mode: 'boolean' })
	},
	(table) => [
		index('message_body+createdAt_idx').on(table.body, table.createdAt),
		index('message_body+createdAt+threadId_idx').on(table.body, table.createdAt, table.threadId),
		index('message_createdAt+threadId_idx').on(table.createdAt, table.threadId),
		index('message_createdAt_idx').on(table.createdAt)
	]
)
export const attachment = sqliteTable('attachment', {
	id: text().primaryKey(),
	messageId: text().references(() => message.id, { onDelete: 'cascade' }),
	generalType: integer(),
	url: text()
})

export const threadRelations = relations(thread, ({ many }) => ({
	messages: many(message)
}))
export const messageRelations = relations(message, ({ one, many }) => ({
	thread: one(thread, {
		fields: [message.threadId],
		references: [thread.id]
	}),
	attachments: many(attachment)
}))
export const attachmentRelations = relations(attachment, ({ one }) => ({
	message: one(message, {
		fields: [attachment.messageId],
		references: [message.id]
	})
}))
