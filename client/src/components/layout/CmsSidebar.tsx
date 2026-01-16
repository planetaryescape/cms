import { Link, useRouterState } from "@tanstack/react-router";
import {
	FileTextIcon,
	ImageIcon,
	TagIcon,
	LogOutIcon,
	UserIcon,
	ChevronUpIcon,
} from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
	{
		title: "Content",
		url: "/cms/content",
		icon: FileTextIcon,
		disabled: false,
	},
	{
		title: "Media",
		url: "/cms/media",
		icon: ImageIcon,
		disabled: true,
	},
	{
		title: "Tags",
		url: "/cms/tags",
		icon: TagIcon,
		disabled: true,
	},
];

export function CmsSidebar() {
	const { data: session } = useSession();
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	const handleSignOut = async () => {
		await signOut();
		window.location.href = "/";
	};

	return (
		<Sidebar>
			<SidebarHeader>
				<div className="flex items-center gap-2 px-2 py-1">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
						CMS
					</div>
					<span className="font-semibold">Content Manager</span>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const isActive = currentPath.startsWith(item.url);
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild={!item.disabled}
											isActive={isActive}
											disabled={item.disabled}
											tooltip={
												item.disabled ? `${item.title} (Coming Soon)` : item.title
											}
										>
											{item.disabled ? (
												<span className="opacity-50 cursor-not-allowed">
													<item.icon className="size-4" />
													<span>{item.title}</span>
												</span>
											) : (
												<Link to={item.url}>
													<item.icon className="size-4" />
													<span>{item.title}</span>
												</Link>
											)}
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
										<UserIcon className="size-4" />
									</div>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">
											{session?.user?.name ?? "User"}
										</span>
										<span className="truncate text-xs text-muted-foreground">
											{session?.user?.email ?? ""}
										</span>
									</div>
									<ChevronUpIcon className="ml-auto size-4" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
								side="top"
								align="start"
								sideOffset={4}
							>
								<DropdownMenuItem asChild>
									<Link to="/profile">
										<UserIcon className="mr-2 size-4" />
										Profile
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleSignOut}>
									<LogOutIcon className="mr-2 size-4" />
									Sign Out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
