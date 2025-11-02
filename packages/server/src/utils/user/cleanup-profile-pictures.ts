import fs from "node:fs/promises";
import path from "node:path";


export const deleteProfilePicture = async (
	filePath: string,
): Promise<void> => {
	try {
		await fs.unlink(filePath);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			throw error;
		}
	}
};


export const cleanupOldProfilePictures = async (
	userId: string,
	currentFileName?: string,
): Promise<void> => {
	const publicPath = path.join(process.cwd(), "public");
	const userProfileDir = path.join(publicPath, "uploads/profiles", userId);

	try {
		const files = await fs.readdir(userProfileDir);

		for (const file of files) {
			if (currentFileName && file === currentFileName) {
				continue;
			}

			if (file.startsWith(`${userId}-`)) {
				const filePath = path.join(userProfileDir, file);
				await deleteProfilePicture(filePath);
			}
		}
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			throw error;
		}
	}
};
