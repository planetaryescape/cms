import { Schema as S } from "@effect/schema";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";
import {
	formatPreferencesFromString,
	parsePreferences,
	UserProfileUpdate,
} from "@/lib/validators";

export const Route = createFileRoute("/profile")({
	component: ProfilePage,
});

async function updateProfile(data: {
	bio?: string;
	preferences?: Record<string, unknown>;
}) {
	const response = await fetch("/api/user/profile", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to update profile");
	}

	return response.json();
}

function ProfilePage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: session, isPending } = useSession();

	const [isEditing, setIsEditing] = useState(false);
	const [bio, setBio] = useState("");
	const [preferencesJson, setPreferencesJson] = useState("{}");
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const mutation = useMutation({
		mutationFn: updateProfile,
		onSuccess: () => {
			setSuccessMessage("Profile updated successfully!");
			setIsEditing(false);
			queryClient.invalidateQueries({ queryKey: ["session"] });
		},
		onError: (e: Error) => {
			setError(e.message);
		},
	});

	useEffect(() => {
		if (session?.user) {
			const user = session.user as Record<string, unknown>;
			setBio((user.bio as string) || "");
			setPreferencesJson(
				formatPreferencesFromString(
					user.preferences as string | null | undefined,
				),
			);
		}
	}, [session]);

	const handleSignOut = async () => {
		await signOut();
		navigate({ to: "/" });
	};

	const handleSave = () => {
		setError(null);
		setSuccessMessage(null);

		const prefs = parsePreferences(preferencesJson);
		const input = {
			bio: bio || null,
			preferences: prefs || null,
		};

		try {
			S.decodeUnknownSync(UserProfileUpdate)(input);
			const apiData: { bio?: string; preferences?: Record<string, unknown> } =
				{};
			if (typeof input.bio === "string") apiData.bio = input.bio;
			if (input.preferences && typeof input.preferences === "object") {
				apiData.preferences = input.preferences;
			}
			mutation.mutate(apiData);
		} catch (e) {
			setError(`Validation failed: ${String(e)}`);
		}
	};

	const handleCancel = () => {
		setIsEditing(false);
		setError(null);
		setSuccessMessage(null);
		if (session?.user) {
			const user = session.user as Record<string, unknown>;
			setBio((user.bio as string) || "");
			setPreferencesJson(
				formatPreferencesFromString(
					user.preferences as string | null | undefined,
				),
			);
		}
	};

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-lg">Loading...</p>
				</div>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
					<h2 className="text-2xl font-bold">Not Authenticated</h2>
					<p className="text-gray-600">Please sign in to view your profile</p>
					<Button onClick={() => navigate({ to: "/signin" })}>
						Go to Sign In
					</Button>
				</div>
			</div>
		);
	}

	const user = session.user as Record<string, unknown>;
	const role = (user.role as string) || "viewer";
	const isActive = user.isActive as boolean;
	const email = user.email as string;
	const name = user.name as string;
	const id = user.id as string;
	const createdAt = user.createdAt as string;

	return (
		<div className="min-h-screen bg-gray-50 py-12">
			<div className="max-w-2xl mx-auto px-4">
				<div className="bg-white rounded-lg shadow overflow-hidden">
					<div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
								{name?.charAt(0)?.toUpperCase() || "U"}
							</div>
							<div className="text-white">
								<h1 className="text-2xl font-bold">{name}</h1>
								<p className="opacity-90">{email}</p>
							</div>
						</div>
					</div>

					<div className="p-8 space-y-6">
						<div className="flex justify-between items-center">
							<h2 className="text-xl font-semibold">Profile Settings</h2>
							<div className="flex gap-2">
								{!isEditing ? (
									<Button onClick={() => setIsEditing(true)}>
										Edit Profile
									</Button>
								) : (
									<>
										<Button variant="secondary" onClick={handleCancel}>
											Cancel
										</Button>
										<Button onClick={handleSave}>Save Changes</Button>
									</>
								)}
							</div>
						</div>

						{successMessage && (
							<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
								{successMessage}
							</div>
						)}

						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
								{error}
							</div>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div className="bg-gray-50 p-4 rounded-md">
								<span className="text-sm text-gray-500 block">Role</span>
								<span className="font-medium capitalize">{role}</span>
							</div>
							<div className="bg-gray-50 p-4 rounded-md">
								<span className="text-sm text-gray-500 block">Status</span>
								<span
									className={`font-medium ${isActive ? "text-green-600" : "text-red-600"}`}
								>
									{isActive ? "Active" : "Inactive"}
								</span>
							</div>
							<div className="bg-gray-50 p-4 rounded-md">
								<span className="text-sm text-gray-500 block">User ID</span>
								<span className="font-mono text-sm">{id}</span>
							</div>
							<div className="bg-gray-50 p-4 rounded-md">
								<span className="text-sm text-gray-500 block">
									Member Since
								</span>
								<span className="font-medium">
									{createdAt ? new Date(createdAt).toLocaleDateString() : "N/A"}
								</span>
							</div>
						</div>

						<div className="border-t pt-6">
							<h3 className="text-lg font-medium mb-4">
								Extended Profile Fields (Effect Schema Validated)
							</h3>

							<div className="space-y-4">
								<div>
									<label
										htmlFor="bio"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Bio
									</label>
									{isEditing ? (
										<textarea
											id="bio"
											value={bio}
											onChange={(e) => setBio(e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											rows={3}
											placeholder="Tell us about yourself..."
										/>
									) : (
										<div className="bg-gray-50 p-3 rounded-md text-gray-700">
											{bio || <em className="text-gray-400">No bio set</em>}
										</div>
									)}
								</div>

								<div>
									<label
										htmlFor="preferences"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Preferences (JSON)
									</label>
									{isEditing ? (
										<textarea
											id="preferences"
											value={preferencesJson}
											onChange={(e) => setPreferencesJson(e.target.value)}
											className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm border-gray-300"
											rows={6}
											placeholder='{"theme": "dark", "notifications": true}'
										/>
									) : (
										<pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-auto text-sm">
											{preferencesJson}
										</pre>
									)}
									{isEditing && (
										<p className="text-xs text-gray-500 mt-1">
											Valid keys: theme (light/dark/system), notifications
											(true/false), language (string)
										</p>
									)}
								</div>
							</div>
						</div>

						<div className="border-t pt-6 flex gap-4">
							<Link to="/dashboard">
								<Button variant="secondary">Back to Dashboard</Button>
							</Link>
							<Button variant="outline" onClick={handleSignOut}>
								Sign Out
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ProfilePage;
