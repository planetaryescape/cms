import type { auth } from "@server/lib/auth";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL:
		typeof window !== "undefined"
			? window.location.origin
			: "http://localhost:5173",
	plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
