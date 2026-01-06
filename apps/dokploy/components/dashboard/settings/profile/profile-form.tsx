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
import { generateSHA256Hash } from "@/lib/utils";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, User } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Disable2FA } from "./disable-2fa";
import { Enable2FA } from "./enable-2fa";

const profileSchema = z.object({
	name: z.string().optional(),
	email: z.string().min(1, "email is required!!").email("please enter a valid email address"),
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

// have a max file size of 2 MB?
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// accepted image types
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

// helper to check if a string is a base64 data URLs
const isBase64Image = (str: string) => str.startsWith("data:image/");

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
	const { t } = useTranslation("settings");
	const [gravatarHash, setGravatarHash] = useState<string | null>(null);
	const [uploadedImage, setUploadedImage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const availableAvatars = useMemo(() => {
		if (gravatarHash === null) return randomImages;
		return randomImages.concat([
			`https://www.gravatar.com/avatar/${gravatarHash}`,
		]);
	}, [gravatarHash]);

	const form = useForm<Profile>({
		defaultValues: {
			name: data?.user?.name || "",
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

			// restoring!
			if (data?.user?.image && isBase64Image(data.user.image)) {
				setUploadedImage(data.user.image);
			}

			if (data.user.email) {
				generateSHA256Hash(data.user.email).then((hash) => {
					setGravatarHash(hash);
				});
			}
		}
	}, [form, data]);

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// validations
		if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
			toast.error("upload a valid image file (JPEG, PNG, GIF, or WebP)");
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			toast.error("your image size must be less than 2MB");
			return;
		}

		// converting to base 64
		const reader = new FileReader();
		reader.onloadend = () => {
			const base64String = reader.result as string;
			setUploadedImage(base64String);
			form.setValue("image", base64String);
		};
		reader.onerror = () => {
			toast.error("Failed to read the image file");
		};
		reader.readAsDataURL(file);

		// reset the input 
		event.target.value = "";
	};

	const triggerFileUpload = () => {
		fileInputRef.current?.click();
	};

	const onSubmit = async (values: Profile) => {
		await mutateAsync({
			name: values.name,
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

	// if the current image value is the uploaded image check
	const currentImageValue = form.watch("image");
	const isUploadedImageSelected = uploadedImage && currentImageValue === uploadedImage;

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
												name="name"
												render={({ field }) => (
													<FormItem>
														<FormLabel>{t("Name")}</FormLabel>
														<FormControl>
															<Input
																placeholder={t("name")}
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
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
																}}
																defaultValue={field.value}
																value={field.value}
																className="flex flex-row flex-wrap gap-2 max-xl:justify-center"
															>
																{/* Upload Custom Image Option */}
																<FormItem>
																	<FormLabel
																		className={`cursor-pointer ${
																			isUploadedImageSelected
																				? "ring-2 ring-primary ring-offset-2 rounded-full"
																				: ""
																		}`}
																	>
																		<input
																			ref={fileInputRef}
																			type="file"
																			accept={ACCEPTED_IMAGE_TYPES.join(",")}
																			onChange={handleFileUpload}
																			className="sr-only"
																		/>
																		{uploadedImage ? (
																			<div
																				onClick={(e) => {
																					// If clicking on uploaded image and it's not selected, select it
																					if (!isUploadedImageSelected) {
																						e.preventDefault();
																						field.onChange(uploadedImage);
																					} else {
																						// If already selected, trigger new upload
																						e.preventDefault();
																						triggerFileUpload();
																					}
																				}}
																				className="relative group"
																			>
																				<img
																					src={uploadedImage}
																					alt="Uploaded avatar"
																					className="h-12 w-12 rounded-full border object-cover hover:border-primary transition-transform"
																				/>
																				<div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
																					<Upload className="size-4 text-white" />
																				</div>
																			</div>
																		) : (
																			<div
																				onClick={(e) => {
																					e.preventDefault();
																					triggerFileUpload();
																				}}
																				className="h-12 w-12 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-primary hover:bg-muted/50 transition-colors"
																			>
																				<Upload className="size-4 text-muted-foreground" />
																			</div>
																		)}
																	</FormLabel>
																</FormItem>

																{/* Predefined Avatars */}
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
															Click the upload icon to use your own image (max 2MB)
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
