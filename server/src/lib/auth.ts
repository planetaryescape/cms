import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
	database: new Pool({
		connectionString:
			process.env.DATABASE_URL ||
			"postgresql://postgres:postgres@localhost:2345/bhvr",
	}),
	emailAndPassword: {
		enabled: true,
	},
	trustedOrigins: [
		"http://localhost:5173",
		"http://localhost:5174",
		"http://localhost:5175",
		"http://localhost:3000",
	],
});
