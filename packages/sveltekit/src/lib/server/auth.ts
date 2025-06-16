import { dev } from '$app/environment'
import {
	DATABASE_URL,
	DATABASE_AUTH_TOKEN,
	BETTER_AUTH_SECRET,
	BETTER_AUTH_URL,
	COOKIE_DOMAIN,
	DISCORD_CLIENT_SECRET
} from '$env/static/private'
import { PUBLIC_DISCORD_APP_ID } from '$env/static/public'
import { getAuthServer, getDB } from 'shared'

console.log(BETTER_AUTH_URL, BETTER_AUTH_SECRET)
export const auth = getAuthServer(
	getDB({ DATABASE_URL, DATABASE_AUTH_TOKEN }),
	{
		BETTER_AUTH_SECRET,
		BETTER_AUTH_URL,
		COOKIE_DOMAIN,
		DISCORD_CLIENT_SECRET,
		PUBLIC_DISCORD_APP_ID
	},
	dev
)
