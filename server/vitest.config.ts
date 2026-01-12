import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./test/setup.ts"],
		testTimeout: 30000,
		hookTimeout: 30000,
		exclude: ["@reference/**/*"],
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: false,
			},
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"test/",
				"dist/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/mockData.ts",
			],
		},
		env: {
			NODE_ENV: "test",
		},
	},
	resolve: {
		alias: {
			"@server": path.resolve(__dirname, "./src"),
		},
	},
});
