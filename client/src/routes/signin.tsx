import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/signin")({
	component: SignInPage,
});

function SignInPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			await signIn.email({
				email,
				password,
			});
			navigate({ to: "/dashboard" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign in failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
				<div>
					<h2 className="text-3xl font-bold text-center">Sign In</h2>
					<p className="mt-2 text-center text-gray-600">
						Welcome back! Please sign in to your account
					</p>
				</div>

				<form onSubmit={handleSubmit} className="mt-8 space-y-6">
					{error && (
						<div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
							{error}
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700"
							>
								Email
							</label>
							<input
								id="email"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700"
							>
								Password
							</label>
							<input
								id="password"
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Signing in..." : "Sign In"}
					</Button>

					<p className="text-center text-sm text-gray-600">
						Don't have an account?{" "}
						<a href="/signup" className="text-blue-600 hover:underline">
							Sign up
						</a>
					</p>
				</form>
			</div>
		</div>
	);
}

export default SignInPage;
