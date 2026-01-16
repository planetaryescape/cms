import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
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

  // if (!session) {
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold">Not Authenticated</h2>
          <p className="text-gray-600">
            Please sign in to access the dashboard
          </p>
          <Button onClick={() => navigate({ to: "/signin" })}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {session.user?.name}!
              </p>
            </div>
            <Button variant="secondary" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">User Information</h2>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {session.user?.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {session.user?.email}
                </div>
                <div>
                  <span className="font-medium">User ID:</span>{" "}
                  {session.user?.id}
                </div>
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="mt-2">
                    Edit Extended Profile
                  </Button>
                </Link>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">
                Session Information
              </h2>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div>
                  <span className="font-medium">Session ID:</span>{" "}
                  {session.session?.id}
                </div>
                <div>
                  <span className="font-medium">Expires At:</span>{" "}
                  {session.session?.expiresAt
                    ? new Date(session.session.expiresAt).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Raw Session Data</h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
