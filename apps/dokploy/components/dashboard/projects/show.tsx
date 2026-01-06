import { BreadcrumbSidebar } from "@/components/shared/breadcrumb-sidebar";
import { DateTooltip } from "@/components/shared/date-tooltip";
import { StatusTooltip } from "@/components/shared/status-tooltip";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/utils/api";
import {
	AlertTriangle,
	BookIcon,
	ExternalLinkIcon,
	FolderInput,
	Loader2,
	MoreHorizontalIcon,
	Search,
	TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HandleProject } from "./handle-project";
import { ProjectEnvironment } from "./project-environment";

// created some type definitions 
type SortOption =
	| "name-asc"
	| "name-desc"
	| "createdAt-desc"
	| "createdAt-asc"
	| "services-desc"
	| "services-asc";

// LocalStorage key for persisting sort preference
const SORT_STORAGE_KEY = "dokploy-projects-sort";

// Default sort option (creation date, newest first)
const DEFAULT_SORT: SortOption = "createdAt-desc";

// validates if a string is a valid sort option
const isValidSortOption = (value: string): value is SortOption => {
	return [
		"name-asc",
		"name-desc",
		"createdAt-desc",
		"createdAt-asc",
		"services-desc",
		"services-asc",
	].includes(value);
};

// sort option labels
const SORT_LABELS: Record<SortOption, string> = {
	"name-asc": "Name (A–Z)",
	"name-desc": "Name (Z–A)",
	"createdAt-desc": "Created (Newest)",
	"createdAt-asc": "Created (Oldest)",
	"services-desc": "Services (Most)",
	"services-asc": "Services (Least)",
};

export const ShowProjects = () => {
	const utils = api.useUtils();
	const { data, isLoading } = api.project.all.useQuery();
	const { data: auth } = api.user.get.useQuery();
	const { mutateAsync } = api.project.remove.useMutation();
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT);

	// load sort preference from localStorage on mount
	useEffect(() => {
		const savedSort = localStorage.getItem(SORT_STORAGE_KEY);
		if (savedSort && isValidSortOption(savedSort)) {
			setSortOption(savedSort);
		}
	}, []);

	// save sort preference to localStorage when it changes
	useEffect(() => {
		localStorage.setItem(SORT_STORAGE_KEY, sortOption);
	}, [sortOption]);

	const filteredProjects = useMemo(() => {
		if (!data) return [];

		// making sure to filter by the search query
		let filtered = data.filter(
			(project) =>
				project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				project.description?.toLowerCase().includes(searchQuery.toLowerCase()),
		);

		// can then filter sorted results 
		filtered = [...filtered].sort((a, b) => {
			// quick helper to count total services 
			const countServices = (project: typeof a) =>
				(project.mariadb?.length || 0) +
				(project.mongo?.length || 0) +
				(project.mysql?.length || 0) +
				(project.postgres?.length || 0) +
				(project.redis?.length || 0) +
				(project.applications?.length || 0) +
				(project.compose?.length || 0);

			switch (sortOption) {
				case "name-asc":
					return a.name.localeCompare(b.name);
				case "name-desc":
					return b.name.localeCompare(a.name);
				case "createdAt-desc":
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					);
				case "createdAt-asc":
					return (
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
					);
				case "services-desc":
					return countServices(b) - countServices(a);
				case "services-asc":
					return countServices(a) - countServices(b);
				default:
					return 0;
			}
		});

		return filtered;
	}, [data, searchQuery, sortOption]);

	return (
		<>
			<BreadcrumbSidebar
				list={[{ name: "Projects", href: "/dashboard/projects" }]}
			/>
			<div className="w-full">
				<Card className="h-full bg-sidebar p-2.5 rounded-xl  ">
					<div className="rounded-xl bg-background shadow-md ">
						<div className="flex justify-between gap-4 w-full items-center flex-wrap p-6">
							<CardHeader className="p-0">
								<CardTitle className="text-xl flex flex-row gap-2">
									<FolderInput className="size-6 text-muted-foreground self-center" />
									Projects
								</CardTitle>
								<CardDescription>
									Create and manage your projects
								</CardDescription>
							</CardHeader>

							{(auth?.role === "owner" || auth?.canCreateProjects) && (
								<div className="">
									<HandleProject />
								</div>
							)}
						</div>

						<CardContent className="space-y-2 py-8 border-t gap-4 flex flex-col min-h-[60vh]">
							{isLoading ? (
								<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[60vh]">
									<span>Loading...</span>
									<Loader2 className="animate-spin size-4" />
								</div>
							) : (
								<>
									{/* search and sort controls here! */}
									<div className="w-full flex flex-col sm:flex-row gap-3">
										<div className="relative flex-1">
											<Input
												placeholder="filter projects..."
												value={searchQuery}
												onChange={(e) => setSearchQuery(e.target.value)}
												className="pr-10"
											/>
											<Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
										</div>
										<Select
											value={sortOption}
											onValueChange={(value: SortOption) => setSortOption(value)}
										>
											<SelectTrigger className="w-full sm:w-48">
												<SelectValue placeholder="Sort by" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectLabel>Sort by</SelectLabel>
													{(Object.keys(SORT_LABELS) as SortOption[]).map(
														(option) => (
															<SelectItem key={option} value={option}>
																{SORT_LABELS[option]}
															</SelectItem>
														),
													)}
												</SelectGroup>
											</SelectContent>
										</Select>
									</div>
									{filteredProjects?.length === 0 && (
										<div className="mt-6 flex h-[50vh] w-full flex-col items-center justify-center space-y-4">
											<FolderInput className="size-8 self-center text-muted-foreground" />
											<span className="text-center font-medium text-muted-foreground">
												No projects found
											</span>
										</div>
									)}
									<div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 flex-wrap gap-5">
										{filteredProjects?.map((project) => {
											const emptyServices =
												project?.mariadb.length === 0 &&
												project?.mongo.length === 0 &&
												project?.mysql.length === 0 &&
												project?.postgres.length === 0 &&
												project?.redis.length === 0 &&
												project?.applications.length === 0 &&
												project?.compose.length === 0;

											const totalServices =
												project?.mariadb.length +
												project?.mongo.length +
												project?.mysql.length +
												project?.postgres.length +
												project?.redis.length +
												project?.applications.length +
												project?.compose.length;

											return (
												<div
													key={project.projectId}
													className="w-full lg:max-w-md"
												>
													<Link
														href={`/dashboard/project/${project.projectId}`}
													>
														<Card className="group relative w-full h-full bg-transparent transition-colors hover:bg-border">
															{project.applications.length > 0 ||
															project.compose.length > 0 ? (
																<DropdownMenu>
																	<DropdownMenuTrigger asChild>
																		<Button
																			className="absolute -right-3 -top-3 size-9 translate-y-1 rounded-full p-0 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
																			size="sm"
																			variant="default"
																		>
																			<ExternalLinkIcon className="size-3.5" />
																		</Button>
																	</DropdownMenuTrigger>
																	<DropdownMenuContent
																		className="w-[200px] space-y-2 overflow-y-auto max-h-[400px]"
																		onClick={(e) => e.stopPropagation()}
																	>
																		{project.applications.length > 0 && (
																			<DropdownMenuGroup>
																				<DropdownMenuLabel>
																					Applications
																				</DropdownMenuLabel>
																				{project.applications.map((app) => (
																					<div key={app.applicationId}>
																						<DropdownMenuSeparator />
																						<DropdownMenuGroup>
																							<DropdownMenuLabel className="font-normal capitalize text-xs flex items-center justify-between">
																								{app.name}
																								<StatusTooltip
																									status={app.applicationStatus}
																								/>
																							</DropdownMenuLabel>
																							<DropdownMenuSeparator />
																							{app.domains.map((domain) => (
																								<DropdownMenuItem
																									key={domain.domainId}
																									asChild
																								>
																									<Link
																										className="space-x-4 text-xs cursor-pointer justify-between"
																										target="_blank"
																										href={`${domain.https ? "https" : "http"}://${domain.host}${domain.path}`}
																									>
																										<span className="truncate">
																											{domain.host}
																										</span>
																										<ExternalLinkIcon className="size-4 shrink-0" />
																									</Link>
																								</DropdownMenuItem>
																							))}
																						</DropdownMenuGroup>
																					</div>
																				))}
																			</DropdownMenuGroup>
																		)}
																		{project.compose.length > 0 && (
																			<DropdownMenuGroup>
																				<DropdownMenuLabel>
																					Compose
																				</DropdownMenuLabel>
																				{project.compose.map((comp) => (
																					<div key={comp.composeId}>
																						<DropdownMenuSeparator />
																						<DropdownMenuGroup>
																							<DropdownMenuLabel className="font-normal capitalize text-xs flex items-center justify-between">
																								{comp.name}
																								<StatusTooltip
																									status={comp.composeStatus}
																								/>
																							</DropdownMenuLabel>
																							<DropdownMenuSeparator />
																							{comp.domains.map((domain) => (
																								<DropdownMenuItem
																									key={domain.domainId}
																									asChild
																								>
																									<Link
																										className="space-x-4 text-xs cursor-pointer justify-between"
																										target="_blank"
																										href={`${domain.https ? "https" : "http"}://${domain.host}${domain.path}`}
																									>
																										<span className="truncate">
																											{domain.host}
																										</span>
																										<ExternalLinkIcon className="size-4 shrink-0" />
																									</Link>
																								</DropdownMenuItem>
																							))}
																						</DropdownMenuGroup>
																					</div>
																				))}
																			</DropdownMenuGroup>
																		)}
																	</DropdownMenuContent>
																</DropdownMenu>
															) : null}
															<CardHeader>
																<CardTitle className="flex items-center justify-between gap-2">
																	<span className="flex flex-col gap-1.5">
																		<div className="flex items-center gap-2">
																			<BookIcon className="size-4 text-muted-foreground" />
																			<span className="text-base font-medium leading-none">
																				{project.name}
																			</span>
																		</div>

																		<span className="text-sm font-medium text-muted-foreground">
																			{project.description}
																		</span>
																	</span>
																	<div className="flex self-start space-x-1">
																		<DropdownMenu>
																			<DropdownMenuTrigger asChild>
																				<Button
																					variant="ghost"
																					size="icon"
																					className="px-2"
																				>
																					<MoreHorizontalIcon className="size-5" />
																				</Button>
																			</DropdownMenuTrigger>
																			<DropdownMenuContent
																				className="w-[200px] space-y-2 overflow-y-auto max-h-[280px]"
																				onClick={(e) => e.stopPropagation()}
																			>
																				<DropdownMenuLabel className="font-normal">
																					Actions
																				</DropdownMenuLabel>
																				<div
																					onClick={(e) => e.stopPropagation()}
																				>
																					<ProjectEnvironment
																						projectId={project.projectId}
																					/>
																				</div>
																				<div
																					onClick={(e) => e.stopPropagation()}
																				>
																					<HandleProject
																						projectId={project.projectId}
																					/>
																				</div>

																				<div
																					onClick={(e) => e.stopPropagation()}
																				>
																					{(auth?.role === "owner" ||
																						auth?.canDeleteProjects) && (
																						<AlertDialog>
																							<AlertDialogTrigger className="w-full">
																								<DropdownMenuItem
																									className="w-full cursor-pointer  space-x-3"
																									onSelect={(e) =>
																										e.preventDefault()
																									}
																								>
																									<TrashIcon className="size-4" />
																									<span>Delete</span>
																								</DropdownMenuItem>
																							</AlertDialogTrigger>
																							<AlertDialogContent>
																								<AlertDialogHeader>
																									<AlertDialogTitle>
																										Are you sure to delete this
																										project?
																									</AlertDialogTitle>
																									{!emptyServices ? (
																										<div className="flex flex-row gap-4 rounded-lg bg-yellow-50 p-2 dark:bg-yellow-950">
																											<AlertTriangle className="text-yellow-600 dark:text-yellow-400" />
																											<span className="text-sm text-yellow-600 dark:text-yellow-400">
																												You have active
																												services, please delete
																												them first
																											</span>
																										</div>
																									) : (
																										<AlertDialogDescription>
																											This action cannot be
																											undone
																										</AlertDialogDescription>
																									)}
																								</AlertDialogHeader>
																								<AlertDialogFooter>
																									<AlertDialogCancel>
																										Cancel
																									</AlertDialogCancel>
																									<AlertDialogAction
																										disabled={!emptyServices}
																										onClick={async () => {
																											await mutateAsync({
																												projectId:
																													project.projectId,
																											})
																												.then(() => {
																													toast.success(
																														"Project deleted successfully",
																													);
																												})
																												.catch(() => {
																													toast.error(
																														"Error deleting this project",
																													);
																												})
																												.finally(() => {
																													utils.project.all.invalidate();
																												});
																										}}
																									>
																										Delete
																									</AlertDialogAction>
																								</AlertDialogFooter>
																							</AlertDialogContent>
																						</AlertDialog>
																					)}
																				</div>
																			</DropdownMenuContent>
																		</DropdownMenu>
																	</div>
																</CardTitle>
															</CardHeader>
															<CardFooter className="pt-4">
																<div className="space-y-1 text-sm flex flex-row justify-between max-sm:flex-wrap w-full gap-2 sm:gap-4">
																	<DateTooltip date={project.createdAt}>
																		Created
																	</DateTooltip>
																	<span>
																		{totalServices}{" "}
																		{totalServices === 1
																			? "service"
																			: "services"}
																	</span>
																</div>
															</CardFooter>
														</Card>
													</Link>
												</div>
											);
										})}
									</div>
								</>
							)}
						</CardContent>
					</div>
				</Card>
			</div>
		</>
	);
};
