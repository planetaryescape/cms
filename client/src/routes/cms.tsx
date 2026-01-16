import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { CmsSidebar } from "@/components/layout/CmsSidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/cms")({
	component: CmsLayout,
});

function CmsLayout() {
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-lg text-muted-foreground">Loading...</p>
				</div>
			</div>
		)
	}

	if (!session) {
		navigate({ to: "/signin" });
		return null;
	}

	return (
		<SidebarProvider>
			<CmsSidebar />
			<SidebarInset>
				<header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
				</header>
				<main className="flex-1 overflow-auto">
					<Outlet />
				</main>
			</SidebarInset>
			<Toaster />
		</SidebarProvider>
	)
}
