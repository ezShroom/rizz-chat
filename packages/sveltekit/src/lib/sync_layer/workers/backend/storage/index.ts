// @ts-expect-error wa-sqlite has no type definitions
import { OPFSCoopSyncVFS } from 'wa-sqlite/src/examples/OPFSCoopSyncVFS.js'
// @ts-expect-error wa-sqlite has no type definitions
import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs'
// @ts-expect-error wa-sqlite has no type definitions
import * as SQLite from 'wa-sqlite/src/sqlite-api.js'
import wasmUrl from 'wa-sqlite/dist/wa-sqlite.wasm?url'
import { drizzle, SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import { localSchema } from 'shared'

// I've written comments about my ugly code before. This is probably the MOST ugly it's going to get
// The good news is there isn't much of a need to touch it
// Main reason for this mess is that wa-sqlite is a purely JS project

async function basicDrizzleQuery(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sqlite3: any,
	dbPointer: number,
	sql: string,
	params: unknown[],
	method: 'all' | 'run' | 'get' | 'values'
): Promise<{ rows: unknown[] | unknown[][] }> {
	console.debug(sql, params, method)

	const rows: unknown[][] = []
	let error: Error | null = null

	try {
		for await (const stmt of sqlite3.statements(dbPointer, sql)) {
			if (params.length > 0) {
				sqlite3.bind_collection(stmt, params)
			}

			for (
				let rowResult = await sqlite3.step(stmt);
				rowResult !== SQLite.SQLITE_DONE;
				rowResult = await sqlite3.step(stmt)
			) {
				if (rowResult !== SQLite.SQLITE_ROW) {
					error = new Error(`Expected ${SQLite.SQLITE_ROW} response (at step), got ${rowResult}`)
					break // Don't throw, just break
				}

				const row = sqlite3.row(stmt)
				rows.push(row)
				if (method === 'get') break
			}

			if (error) break // Exit after cleanup
		}
	} catch (e) {
		error = e as Error
	}

	// Now throw after SQLite is done
	if (error) {
		console.error('query failed:', error, 'sql:', sql, 'params:', params)
		throw error
	}

	const result =
		method === 'get' ? { rows: typeof rows[0] !== 'undefined' ? rows[0] : [] } : { rows }
	console.debug(result)
	return result
}

export async function getOPFSDatabase(): Promise<{
	drizzle: SqliteRemoteDatabase<typeof localSchema>
	raw: { sqlite3: unknown; db: number }
}> {
	// 1. fetch the wasm binary
	let wasmBinary
	while (true) {
		// This is our budget retry solution. If it fails we give it another go until it finally works
		wasmBinary = await fetch(wasmUrl)
			.then((res) => res.arrayBuffer())
			.catch(() => {})
		if (wasmBinary) {
			await new Promise((resolve) => setTimeout(resolve, 500))
			break
		}
	}

	// 2. define a custom instantiation function because the one included in wa-sqlite doesn't work
	const instantiateWasm = (
		imports: WebAssembly.Imports,
		successCallback: (instance: WebAssembly.Instance) => void
	) => {
		WebAssembly.instantiate(wasmBinary, imports).then(({ instance }) => {
			successCallback(instance)
		})
		return {} // emscripten requires this return
	}

	// 3. call the factory
	const module = await SQLiteESMFactory({
		instantiateWasm
	})

	const sqlite3 = SQLite.Factory(module)

	// Register a custom file system.
	const vfs = await OPFSCoopSyncVFS.create('hello', module)
	sqlite3.vfs_register(vfs, true)

	// Open the database.
	const db = await sqlite3.open_v2('local.db') // NOTE TO SELF: THIS IS A POINTER

	// Get page size and count to know where we're at
	let pageSize: number | undefined
	if (
		(await sqlite3.exec(db, `PRAGMA page_size;`, (row: number[]) => {
			pageSize = row[0]
		})) !== SQLite.SQLITE_OK
	)
		throw new Error('Could not get page size')
	let pageCount: number | undefined
	if (
		(await sqlite3.exec(db, `PRAGMA page_count;`, (row: number[]) => {
			pageCount = row[0]
		})) !== SQLite.SQLITE_OK
	)
		throw new Error('Could not get page count')
	if (typeof pageSize === 'undefined' || typeof pageCount === 'undefined')
		throw new Error('SQLite is not reporting storage')

	const { quota } = await navigator.storage.estimate()
	if (!quota) throw new Error('Browser is not reporting storage quota')
	console.log(
		`Using ${pageSize * pageCount}B (${quota}B available - ${Math.floor((pageSize * pageCount) / quota)}% used)`
	)

	// TODO: Actually use this data to limit size. We won't for the cloneathon

	return {
		drizzle: drizzle(
			(sql, params, method) => basicDrizzleQuery(sqlite3, db, sql, params, method),
			async (queries) => {
				if ((await sqlite3.exec(db, `BEGIN TRANSACTION;`, () => {})) !== SQLite.SQLITE_OK)
					throw new Error('Could not begin transaction for batch!')

				const queryResults: { rows: unknown[] | unknown[][] }[] = []
				try {
					for (const query of queries) {
						queryResults.push(
							await basicDrizzleQuery(sqlite3, db, query.sql, query.params, query.method)
						)
					}
				} catch (e) {
					if ((await sqlite3.exec(db, `ROLLBACK;`, () => {})) !== SQLite.SQLITE_OK)
						throw new Error('Tried to run transaction, failed, and could not rollback')
					throw e
				}

				// After all queries succeed
				if ((await sqlite3.exec(db, `COMMIT;`, () => {})) !== SQLite.SQLITE_OK)
					throw new Error('Could not commit transaction')

				return queryResults
			}
		),
		raw: { sqlite3, db }
	}
}
