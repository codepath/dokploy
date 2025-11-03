import { db } from "@dokploy/server/db";
import { notifications } from "@dokploy/server/db/schema";
import DatabaseBackupEmail from "@dokploy/server/emails/emails/database-backup";
import { renderAsync } from "@react-email/components";
import { format } from "date-fns";
import { and, eq } from "drizzle-orm";
import {
	sendDiscordNotification,
	sendEmailNotification,
	sendGotifyNotification,
	sendSlackNotification,
	sendTelegramNotification,
} from "./utils";

/**
 * Send database backup notifications across configured channels
 * @param databaseName - Optional actual database name (e.g., "production-db"). Falls back to applicationName if not provided.
 */
export const sendDatabaseBackupNotifications = async ({
	projectName,
	applicationName,
	databaseName,
	databaseType,
	type,
	errorMessage,
	organizationId,
}: {
	projectName: string;
	applicationName: string;
	databaseName?: string;
	databaseType: "postgres" | "mysql" | "mongodb" | "mariadb";
	type: "error" | "success";
	organizationId: string;
	errorMessage?: string;
}) => {
	const date = new Date();
	const unixDate = ~~(Number(date) / 1000);
	
	// Use databaseName if provided, fallback to applicationName for backward compatibility
	const displayName = databaseName || applicationName;
	const notificationList = await db.query.notifications.findMany({
		where: and(
			eq(notifications.databaseBackup, true),
			eq(notifications.organizationId, organizationId),
		),
		with: {
			email: true,
			discord: true,
			telegram: true,
			slack: true,
			gotify: true,
		},
	});

	for (const notification of notificationList) {
		const { email, discord, telegram, slack, gotify } = notification;

		if (email) {
			const template = await renderAsync(
				DatabaseBackupEmail({
					projectName,
					applicationName,
					databaseName: displayName,
					databaseType,
					type,
					errorMessage,
					date: date.toLocaleString(),
				}),
			).catch();
			await sendEmailNotification(
				email,
				"Database backup for dokploy",
				template,
			);
		}

		if (discord) {
			const decorate = (decoration: string, text: string) =>
				`${discord.decoration ? decoration : ""} ${text}`.trim();

			await sendDiscordNotification(discord, {
				title:
					type === "success"
						? decorate(">", `\`✅\` Database Backup Successful: ${displayName}`)
						: decorate(">", `\`❌\` Database Backup Failed: ${displayName}`),
				color: type === "success" ? 0x57f287 : 0xed4245,
				fields: [
					{
						name: decorate("`🗄️`", "Database Name"),
						value: displayName,
						inline: true,
					},
					{
						name: decorate("`🛠️`", "Project"),
						value: projectName,
						inline: true,
					},
					{
						name: decorate("`⚙️`", "Application"),
						value: applicationName,
						inline: true,
					},
					{
						name: decorate("`❔`", "Database Type"),
						value: databaseType,
						inline: true,
					},
					{
						name: decorate("`📅`", "Date"),
						value: `<t:${unixDate}:D>`,
						inline: true,
					},
					{
						name: decorate("`⌚`", "Time"),
						value: `<t:${unixDate}:t>`,
						inline: true,
					},
					{
						name: decorate("`❓`", "Type"),
						value: type
							.replace("error", "Failed")
							.replace("success", "Successful"),
						inline: true,
					},
					...(type === "error" && errorMessage
						? [
								{
									name: decorate("`⚠️`", "Error Message"),
									value: `\`\`\`${errorMessage}\`\`\``,
								},
							]
						: []),
				],
				timestamp: date.toISOString(),
				footer: {
					text: "Dokploy Database Backup Notification",
				},
			});
		}

		if (gotify) {
			const decorate = (decoration: string, text: string) =>
				`${gotify.decoration ? decoration : ""} ${text}\n`;

			await sendGotifyNotification(
				gotify,
				decorate(
					type === "success" ? "✅" : "❌",
					`Database Backup ${type === "success" ? "Successful" : "Failed"}: ${displayName}`,
				),
				`${decorate("🗄️", `Database: ${displayName}`)}` +
					`${decorate("🛠️", `Project: ${projectName}`)}` +
					`${decorate("⚙️", `Application: ${applicationName}`)}` +
					`${decorate("❔", `Type: ${databaseType}`)}` +
					`${decorate("🕒", `Date: ${date.toLocaleString()}`)}` +
					`${type === "error" && errorMessage ? decorate("❌", `Error:\n${errorMessage}`) : ""}`,
			);
		}

		if (telegram) {
			const isError = type === "error" && errorMessage;

			const statusEmoji = type === "success" ? "✅" : "❌";
			const typeStatus = type === "success" ? "Successful" : "Failed";
			const errorMsg = isError
				? `\n\n<b>Error:</b>\n<pre>${errorMessage}</pre>`
				: "";

			const messageText = `<b>${statusEmoji} Database Backup ${typeStatus}: ${displayName}</b>\n\n<b>Database Name:</b> ${displayName}\n<b>Project:</b> ${projectName}\n<b>Application:</b> ${applicationName}\n<b>Type:</b> ${databaseType}\n<b>Date:</b> ${format(date, "PP")}\n<b>Time:</b> ${format(date, "pp")}${isError ? errorMsg : ""}`;

			await sendTelegramNotification(telegram, messageText);
		}

		if (slack) {
			const { channel } = slack;
			await sendSlackNotification(slack, {
				channel: channel,
				attachments: [
					{
						color: type === "success" ? "#00FF00" : "#FF0000",
						pretext:
							type === "success"
								? `:white_check_mark: *Database Backup Successful: ${displayName}*`
								: `:x: *Database Backup Failed: ${displayName}*`,
						fields: [
							...(type === "error" && errorMessage
								? [
										{
											title: "Error Message",
											value: errorMessage,
											short: false,
										},
									]
								: []),
							{
								title: "Database Name",
								value: displayName,
								short: true,
							},
							{
								title: "Project",
								value: projectName,
								short: true,
							},
							{
								title: "Application",
								value: applicationName,
								short: true,
							},
							{
								title: "Database Type",
								value: databaseType,
								short: true,
							},
							{
								title: "Time",
								value: date.toLocaleString(),
								short: true,
							},
							{
								title: "Status",
								value: type === "success" ? "Successful" : "Failed",
								short: true,
							},
						],
					},
				],
			});
		}
	}
};
