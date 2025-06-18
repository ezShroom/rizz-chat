import { betterAuth } from 'better-auth'
import { passkey } from 'better-auth/plugins/passkey'
import { drizzleAdapter, type DB } from 'better-auth/adapters/drizzle'

export const getAuthServer = (
	db: DB,
	{
		PUBLIC_DISCORD_APP_ID,
		DISCORD_CLIENT_SECRET,
		BETTER_AUTH_SECRET,
		BETTER_AUTH_URL,
		COOKIE_DOMAIN,
		PUBLIC_SESSION_SERVER_ORIGIN,
		OTHER_TRUSTED_ORIGINS
	}: {
		PUBLIC_DISCORD_APP_ID: string
		DISCORD_CLIENT_SECRET: string
		BETTER_AUTH_SECRET: string
		BETTER_AUTH_URL: string
		COOKIE_DOMAIN: string
		PUBLIC_SESSION_SERVER_ORIGIN: string
		OTHER_TRUSTED_ORIGINS: string
	},
	dev: boolean
) =>
	betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite'
		}),
		socialProviders: {
			discord: {
				clientId: PUBLIC_DISCORD_APP_ID,
				clientSecret: DISCORD_CLIENT_SECRET
			}
		},
		plugins: [
			passkey({
				rpName: 'Rizz Chat'
			})
		],
		secret: BETTER_AUTH_SECRET,
		baseURL: BETTER_AUTH_URL,
		trustedOrigins: [
			PUBLIC_SESSION_SERVER_ORIGIN,
			...(() => {
				try {
					return (JSON.parse(OTHER_TRUSTED_ORIGINS) as string[]).map(
						(trustedOrigin) => `http${dev ? '' : 's'}://${trustedOrigin}`
					);
				} catch (error) {
					console.error('Failed to parse OTHER_TRUSTED_ORIGINS:', error);
					return [];
				}
			})()
		],
		advanced: {
			crossSubDomainCookies: {
				enabled: true,
				domain: COOKIE_DOMAIN
			},
			defaultCookieAttributes: {
				secure: !dev,
				httpOnly: true,
				sameSite: 'lax' // Allows CORS-based cookie sharing across subdomains
			},
			cookiePrefix: 'rizz-chat'
		}
	})
