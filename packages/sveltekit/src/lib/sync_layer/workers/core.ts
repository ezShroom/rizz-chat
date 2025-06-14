import { getOPFSDatabase } from './backend/storage'
import { localMigrations } from 'shared'
import { migrate } from './backend/storage/migrate'

const { drizzle } = await getOPFSDatabase()
await migrate(drizzle, localMigrations)
console.log('yay migrated!')

// Before running migrations, test if the database is still valid
