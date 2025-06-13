// @ts-expect-error wa-sqlite has no type definitions
import { OPFSCoopSyncVFS } from 'wa-sqlite/src/examples/OPFSCoopSyncVFS.js'
// @ts-expect-error wa-sqlite has no type definitions
import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs'
// @ts-expect-error wa-sqlite has no type definitions
import * as SQLite from 'wa-sqlite/src/sqlite-api.js'
import wasmUrl from 'wa-sqlite/dist/wa-sqlite.wasm?url'

console.log('hello from SharedWorker')

// 1. fetch the wasm binary yourself using the URL from vite.
const wasmBinary = await fetch(wasmUrl).then((res) => res.arrayBuffer())

// 2. define your custom instantiation function.
// this function is the contract emscripten expects.
const instantiateWasm = (
	imports: WebAssembly.Imports,
	successCallback: (instance: WebAssembly.Instance) => void
) => {
	// use the standard webassembly api with your own binary.
	WebAssembly.instantiate(wasmBinary, imports).then(({ instance }) => {
		successCallback(instance)
	})
	return {} // emscripten requires this return
}

// 3. call the factory, passing your override.
const module = await SQLiteESMFactory({
	instantiateWasm
})

const sqlite3 = SQLite.Factory(module)

// Register a custom file system.
const vfs = await OPFSCoopSyncVFS.create('hello', module)
sqlite3.vfs_register(vfs, true)

// Open the database.
// NOTE TO SELF: THIS IS A POINTER
const db = await sqlite3.open_v2('test')

const result = await sqlite3.exec(db, "SELECT 'hello from sqlite' as greeting;", (row, columns) => {
	console.log(row)
})

console.log('query successful. result:', result)
