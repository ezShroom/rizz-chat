import { getOPFSDatabase } from './backend/storage'
import { localMigrations, localSchema } from 'shared'
import { migrate } from './backend/storage/migrate'
import { eq } from 'drizzle-orm'

const { drizzle: db } = await getOPFSDatabase()
await migrate(db, localMigrations)
console.log('yay migrated!')

const id = crypto.randomUUID()

await db
	.insert(localSchema.thread)
	.values({
		id,
		title: 'abcdefgh',
		lastKnownModification: new Date()
	})
	.run()
const result = await db.select().from(localSchema.thread).where(eq(localSchema.thread.id, id)).get()
console.log(result)
console.log(result?.lastKnownModification.toDateString())
