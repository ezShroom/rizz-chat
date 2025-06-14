import { getOPFSDatabase } from './backend/storage'
import { localMigrations, localSchema, Sender } from 'shared'
import { migrate } from './backend/storage/migrate'
import { desc, eq, max, type InferInsertModel } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'

export class SyncLayer {
	private db: SqliteRemoteDatabase<typeof localSchema> | undefined
	private ws: WebSocket
	private proxyToOtherTab

	private async init() {
		if (await navigator.storage.getDirectory()) getOPFSDatabase().then()
	}

	constructor() {
		this.ws = new WebSocket('ws://localhost:8787/session')
		this.init()
	}
}

const { drizzle: db } = await getOPFSDatabase()
await migrate(db, localMigrations)
console.log('yay migrated!')

const threads = await db
	.select()
	.from(localSchema.thread)
	.orderBy(desc(localSchema.thread.lastKnownModification))
	.execute()

console.log(threads)

/*async function insertDefaultContent() {
	const [firstThreadId, secondThreadId] = uuidv7()
	console.log(firstThreadId, secondThreadId)
	await db
		.insert(localSchema.thread)
		.values([
			{
				id: firstThreadId,
				title: 'What is Rizz Chat?',
				lastKnownModification: new Date(Date.now() + 1)
			},
			{
				id: secondThreadId,
				title: 'The cloneathon bits',
				lastKnownModification: new Date()
			}
		])
		.run()
	await db
		.insert(localSchema.message)
		.values([
			{
				id: uuidv7(),
				threadId: firstThreadId,
				createdAt: new Date(),
				body: 'What is Rizz Chat?',
				htmlBody: 'What is Rizz Chat?',
				sender: Sender.User,
				model: '00000000-0000-0000-0000-000000000000'
			},
			{
				id: uuidv7(),
				title: 'What is Rizz Chat?',
				lastKnownModification: new Date(Date.now() + 1)
			}
		])
		.run()
}*/
if (!threads) {
	// This is where we WOULD insert dummy data assuming the server has nothing for us
}
