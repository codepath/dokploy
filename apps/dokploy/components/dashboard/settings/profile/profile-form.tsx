import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { cn, generateSHA256Hash } from "@/lib/utils";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, User } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Disable2FA } from "./disable-2fa";
import { Enable2FA } from "./enable-2fa";

const profileSchema = z.object({
	email: z.string(),
	password: z.string().nullable(),
	currentPassword: z.string().nullable(),
	image: z.string().optional(),
	allowImpersonation: z.boolean().optional().default(false),
});

type Profile = z.infer<typeof profileSchema>;

const randomImages = [
	"/avatars/avatar-1.png",
	"/avatars/avatar-2.png",
	"/avatars/avatar-3.png",
	"/avatars/avatar-4.png",
	"/avatars/avatar-5.png",
	"/avatars/avatar-6.png",
	"/avatars/avatar-7.png",
	"/avatars/avatar-8.png",
	"/avatars/avatar-9.png",
	"/avatars/avatar-10.png",
	"/avatars/avatar-11.png",
	"/avatars/avatar-12.png",
];

export const ProfileForm = () => {
	const _utils = api.useUtils();
	const { data, refetch, isLoading } = api.user.get.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();

	const {
		mutateAsync,
		isLoading: isUpdating,
		isError,
		error,
	} = api.user.update.useMutation();

	const {
		mutateAsync: uploadAvatarAsync,
		isLoading: isUploading,
	} = api.user.uploadAvatar.useMutation();

	const { t } = useTranslation("settings");
	const [gravatarHash, setGravatarHash] = useState<string | null>(null);
	const [uploadPreview, setUploadPreview] = useState<string | null>(null);
	const [customAvatarPath, setCustomAvatarPath] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const availableAvatars = useMemo(() => {
		if (gravatarHash === null) return randomImages;
		return randomImages.concat([
			`https://www.gravatar.com/avatar/${gravatarHash}`,
		]);
	}, [gravatarHash]);

	// Check if image path is a custom upload
	const isCustomAvatar = useCallback((imagePath: string | undefined | null) => {
		return imagePath?.startsWith("/avatars/user-") ?? false;
	}, []);

	// Handle file selection
	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>,
		fieldOnChange: (value: string) => void,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		const allowedTypes = [
			"image/png",
			"image/jpeg",
			"image/jpg",
			"image/gif",
			"image/webp",
		];
		if (!allowedTypes.includes(file.type)) {
			toast.error(
				"Invalid file type. Only PNG, JPEG, GIF, and WebP images are allowed.",
			);
			return;
		}

		// Validate file size (2MB)
		const maxSize = 2 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error("File size exceeds 2MB limit.");
			return;
		}

		// Show preview
		const previewUrl = URL.createObjectURL(file);
		setUploadPreview(previewUrl);

		// Upload the file
		const formData = new FormData();
		formData.append("file", file);

		try {
			const result = await uploadAvatarAsync(formData);
			setCustomAvatarPath(result.imagePath);
			fieldOnChange(result.imagePath);
			toast.success("Avatar uploaded successfully");
			await refetch();
		} catch (uploadError) {
			toast.error("Error uploading avatar");
			setUploadPreview(null);
		}

		// Clean up the input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Clean up preview URL on unmount
	useEffect(() => {
		return () => {
			if (uploadPreview) {
				URL.revokeObjectURL(uploadPreview);
			}
		};
	}, [uploadPreview]);

	const form = useForm<Profile>({
		defaultValues: {
			email: data?.user?.email || "",
			password: "",
			image: data?.user?.image || "",
			currentPassword: "",
			allowImpersonation: data?.user?.allowImpersonation || false,
		},
		resolver: zodResolver(profileSchema),
	});

	useEffect(() => {
		if (data) {
			form.reset(
				{
					email: data?.user?.email || "",
					password: form.getValues("password") || "",
					image: data?.user?.image || "",
					currentPassword: form.getValues("currentPassword") || "",
					allowImpersonation: data?.user?.allowImpersonation,
				},
				{
					keepValues: true,
				},
			);
			form.setValue("allowImpersonation", data?.user?.allowImpersonation);

			if (data.user.email) {
				generateSHA256Hash(data.user.email).then((hash) => {
					setGravatarHash(hash);
				});
			}

			// Set custom avatar path if user has one
			if (isCustomAvatar(data.user.image)) {
				setCustomAvatarPath(data.user.image);
			}
		}
	}, [form, data, isCustomAvatar]);

	const onSubmit = async (values: Profile) => {
		await mutateAsync({
			email: values.email.toLowerCase(),
			password: values.password || undefined,
			image: values.image,
			currentPassword: values.currentPassword || undefined,
			allowImpersonation: values.allowImpersonation,
		})
			.then(async () => {
				await refetch();
				toast.success("Profile Updated");
				form.reset({
					email: values.email,
					password: "",
					image: values.image,
					currentPassword: "",
				});
			})
			.catch(() => {
				toast.error("Error updating the profile");
			});
	};

	return (
		<div className="w-full">
			<Card className="h-full bg-sidebar  p-2.5 rounded-xl  max-w-5xl mx-auto">
				<div className="rounded-xl bg-background shadow-md ">
					<CardHeader className="flex flex-row gap-2 flex-wrap justify-between items-center">
						<div>
							<CardTitle className="text-xl flex flex-row gap-2">
								<User className="size-6 text-muted-foreground self-center" />
								{t("settings.profile.title")}
							</CardTitle>
							<CardDescription>
								{t("settings.profile.description")}
							</CardDescription>
						</div>
						{!data?.user.twoFactorEnabled ? <Enable2FA /> : <Disable2FA />}
					</CardHeader>

					<CardContent className="space-y-2 py-8 border-t">
						{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}
						{isLoading ? (
							<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[35vh]">
								<span>Loading...</span>
								<Loader2 className="animate-spin size-4" />
							</div>
						) : (
							<>
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onSubmit)}
										className="grid gap-4"
									>
										<div className="space-y-4">
											<FormField
												control={form.control}
												name="email"
												render={({ field }) => (
													<FormItem>
														<FormLabel>{t("settings.profile.email")}</FormLabel>
														<FormControl>
															<Input
																placeholder={t("settings.profile.email")}
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="currentPassword"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Current Password</FormLabel>
														<FormControl>
															<Input
																type="password"
																placeholder={t("settings.profile.password")}
																{...field}
																value={field.value || ""}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="password"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("settings.profile.password")}
														</FormLabel>
														<FormControl>
															<Input
																type="password"
																placeholder={t("settings.profile.password")}
																{...field}
																value={field.value || ""}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="image"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("settings.profile.avatar")}
														</FormLabel>
														<FormControl>
															<RadioGroup
																onValueChange={(e) => {
																	field.onChange(e);
																	// Clear upload preview when selecting a predefined avatar
																	if (!isCustomAvatar(e)) {
																		setUploadPreview(null);
																	}
																}}
																defaultValue={field.value}
																value={field.value}
																className="flex flex-row flex-wrap gap-2 max-xl:justify-center"
															>
																{/* Upload button - always shows upload icon */}
																<FormItem>
																	<FormLabel className="cursor-pointer">
																		<div
																			className={cn(
																				"h-12 w-12 rounded-full border flex items-center justify-center hover:border-primary transition-transform",
																				isUploading && "opacity-50",
																			)}
																			onClick={(e) => {
																				e.preventDefault();
																				fileInputRef.current?.click();
																			}}
																		>
																			{isUploading ? (
																				<Loader2 className="size-5 animate-spin text-muted-foreground" />
																			) : (
																				<Upload className="size-5 text-muted-foreground" />
																			)}
																		</div>
																		<input
																			ref={fileInputRef}
																			type="file"
																			accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
																			className="hidden"
																			onChange={(e) =>
																				handleFileSelect(e, field.onChange)
																			}
																		/>
																	</FormLabel>
																</FormItem>

																{/* Custom avatar - shows when user has uploaded one */}
																{(uploadPreview || customAvatarPath) && (
																	<FormItem>
																		<FormLabel className="[&:has([data-state=checked])>img]:border-primary [&:has([data-state=checked])>img]:border-1 [&:has([data-state=checked])>img]:p-px cursor-pointer">
																			<FormControl>
																				<RadioGroupItem
																					value={customAvatarPath || "custom-upload"}
																					className="sr-only"
																				/>
																			</FormControl>
																			<img
																				src={uploadPreview || customAvatarPath || ""}
																				alt="Custom avatar"
																				className="h-12 w-12 rounded-full border hover:p-px hover:border-primary transition-transform object-cover"
																			/>
																		</FormLabel>
																	</FormItem>
																)}

																{/* Predefined avatars */}
																{availableAvatars.map((image) => (
																	<FormItem key={image}>
																		<FormLabel className="[&:has([data-state=checked])>img]:border-primary [&:has([data-state=checked])>img]:border-1 [&:has([data-state=checked])>img]:p-px cursor-pointer">
																			<FormControl>
																				<RadioGroupItem
																					value={image}
																					className="sr-only"
																				/>
																			</FormControl>

																			<img
																				key={image}
																				src={image}
																				alt="avatar"
																				className="h-12 w-12 rounded-full border hover:p-px hover:border-primary transition-transform"
																			/>
																		</FormLabel>
																	</FormItem>
																))}
															</RadioGroup>
														</FormControl>
														<FormDescription>
															Click the upload icon to add a custom avatar (max
															2MB, PNG/JPEG/GIF/WebP)
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
											{isCloud && (
												<FormField
													control={form.control}
													name="allowImpersonation"
													render={({ field }) => (
														<FormItem className="flex flex-row items-center justify-between p-3 mt-4 border rounded-lg shadow-sm">
															<div className="space-y-0.5">
																<FormLabel>Allow Impersonation</FormLabel>
																<FormDescription>
																	Enable this option to allow Dokploy Cloud
																	administrators to temporarily access your
																	account for troubleshooting and support
																	purposes. This helps them quickly identify and
																	resolve any issues you may encounter.
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
											)}
										</div>

										<div className="flex items-center justify-end gap-2">
											<Button type="submit" isLoading={isUpdating}>
												{t("settings.common.save")}
											</Button>
										</div>
									</form>
								</Form>
							</>
						)}
					</CardContent>
				</div>
			</Card>
		</div>
	);
};
