// @ts-expect-error wa-sqlite has no type definitions
import { OPFSCoopSyncVFS } from 'wa-sqlite/src/examples/OPFSCoopSyncVFS.js'
// @ts-expect-error wa-sqlite has no type definitions
import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs'
// @ts-expect-error wa-sqlite has no type definitions
import * as SQLite from 'wa-sqlite/src/sqlite-api.js'
import wasmUrl from 'wa-sqlite/dist/wa-sqlite.wasm?url'

// I've written comments about my ugly code before. This is probably the MOST ugly it's going to get
// The good news is there isn't much of a need to touch it
// Main reason for this mess is that wa-sqlite is a purely JS project
export async function getOPFSDatabase() {
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
	const db = await sqlite3.open_v2('test') // NOTE TO SELF: THIS IS A POINTER

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
		await sqlite3.exec(db, `PRAGMA page_count;`, (row: number[]) => {
			pageCount = row[0]
		})
	)
		throw new Error('Could not get page count')
	if (typeof pageSize === 'undefined' || typeof pageCount === 'undefined')
		throw new Error('SQLite is not reporting storage')

	const { quota } = await navigator.storage.estimate()
	if (!quota) throw new Error('Browser is not reporting storage quota')
	console.log(
		`Using ${pageSize * pageCount}B (${quota}B available - ${(pageSize * pageCount) / quota}% used)`
	)
}
