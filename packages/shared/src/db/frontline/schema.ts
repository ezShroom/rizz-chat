import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { MAX_MESSAGE_LENGTH } from '../../constants'
import { relations } from 'drizzle-orm'

export const thread = sqliteTable(
	'thread',
	{
		id: text().primaryKey(),
		title: text().notNull(),
		lastModified: integer({ mode: 'timestamp_ms' }).notNull()
	},
	(table) => [
		index('thread_lastKnownModification_idx').on(table.lastModified),
		index('thread_title+lastKnownModification_idx').on(table.title, table.lastModified)
	]
)
export const message = sqliteTable(
	'message',
	{
		id: text().primaryKey(),
		threadId: text()
			.references(() => thread.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: integer({ mode: 'timestamp_ms' }).notNull(),
		body: text({ length: MAX_MESSAGE_LENGTH }).notNull(),
		htmlBody: text().notNull(),
		sender: integer().notNull(),
		model: text().notNull(),
		reasoningLevel: integer().notNull(),
		search: integer({ mode: 'boolean' }).notNull()
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
	messageId: text()
		.references(() => message.id, { onDelete: 'cascade' })
		.notNull(),
	generalType: integer().notNull(),
	url: text().notNull()
})

// Side-specific tables. This is NOT how it should be done! But the deadline is approaching.
export const leaders = sqliteTable('leaders', {
	id: text().primaryKey()
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
