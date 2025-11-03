## Milestone 1: Update Notification Function Signature
**Goal:** Add `databaseName` parameter to the notification function with backward compatibility  
**Estimated Time:** 15 minutes  
**Files to Modify:**
- `packages/server/src/utils/notifications/database-backup.ts`

**Tasks:**
- [x] Add `databaseName?: string` to function parameters
- [x] Add fallback logic: `const displayName = databaseName || applicationName`
- [x] Document the new parameter in function JSDoc
- [x] Ensure all existing calls still work (backward compatibility)

**Verification:**
- Code compiles without errors
- No TypeScript errors in file
- Function signature accepts both old and new calling patterns

---

## Milestone 2: Update Email Template
**Goal:** Include database name in email notifications  
**Estimated Time:** 20 minutes  
**Files to Modify:**
- `packages/server/src/emails/emails/database-backup.tsx`

**Tasks:**
- [x] Add `databaseName?: string` to `TemplateProps` interface
- [x] Update component props to accept `databaseName`
- [x] Add fallback: `const displayName = databaseName || applicationName`
- [x] Update email heading to include `{displayName}`
- [x] Update email body text to reference `{displayName}`
- [x] Add "Database Name" field in details section
- [x] Keep "Application Name" field for backward compatibility

**Verification:**
- Email template compiles without errors
- Email preview shows database name in title and details
- Email with missing `databaseName` falls back to `applicationName`

**Manual Test:**
1. Trigger a database backup
2. Check received email notification
3. Verify database name appears in heading and details section

---

## Milestone 3: Update Discord Notifications
**Goal:** Include database name in Discord embeds  
**Estimated Time:** 15 minutes  
**Files to Modify:**
- `packages/server/src/utils/notifications/database-backup.ts`

**Tasks:**
- [x] Use `displayName` in Discord embed title
- [x] Add "Database Name" field to Discord embed fields
- [x] Keep "Application" field for context

**Verification:**
- Code compiles without errors
- Discord embed shows database name prominently

**Manual Test:**
1. Trigger a database backup with Discord notifications configured
2. Check Discord channel for notification
3. Verify database name appears in embed title and fields

---

## Milestone 4: Update Telegram Notifications
**Goal:** Include database name in Telegram messages  
**Estimated Time:** 15 minutes  
**Files to Modify:**
- `packages/server/src/utils/notifications/database-backup.ts`

**Tasks:**
- [x] Use `displayName` in Telegram message heading
- [x] Add "Database:" field to message details
- [x] Keep "Application:" field for context

**Verification:**
- Code compiles without errors
- Telegram message includes database name

**Manual Test:**
1. Trigger a database backup with Telegram notifications configured
2. Check Telegram for notification message
3. Verify database name appears in message heading and details

---

## Milestone 5: Update Slack Notifications
**Goal:** Include database name in Slack attachments  
**Estimated Time:** 15 minutes  
**Files to Modify:**
- `packages/server/src/utils/notifications/database-backup.ts`

**Tasks:**
- [x] Use `displayName` in Slack pretext
- [x] Add "Database" field to Slack attachment fields
- [x] Remove duplicate "Type" field (keep only one)
- [x] Keep "Application" field for context

**Verification:**
- Code compiles without errors
- Slack attachment shows database name

**Manual Test:**
1. Trigger a database backup with Slack notifications configured
2. Check Slack channel for notification
3. Verify database name appears in attachment pretext and fields

---

## Milestone 6: Update Gotify Notifications
**Goal:** Include database name in Gotify messages  
**Estimated Time:** 15 minutes  
**Files to Modify:**
- `packages/server/src/utils/notifications/database-backup.ts`

**Tasks:**
- [x] Use `displayName` in Gotify notification title
- [x] Add "Database:" field to message body
- [x] Keep "Application:" field for context

**Verification:**
- Code compiles without errors
- Gotify message includes database name

**Manual Test:**
1. Trigger a database backup with Gotify notifications configured
2. Check Gotify app for notification
3. Verify database name appears in title and message body

---

## Milestone 7: Update PostgreSQL Backup Function
**Goal:** Pass database name from PostgreSQL backup to notifications  
**Estimated Time:** 10 minutes  
**Files to Modify:**
- `packages/server/src/utils/backups/postgres.ts`

**Tasks:**
- [x] Add `databaseName: postgres.databaseName` to success notification call
- [x] Add `databaseName: postgres.databaseName` to error notification call

**Verification:**
- Code compiles without errors
- PostgreSQL backup notifications include database name

**Manual Test:**
1. Create a PostgreSQL database with a specific database name
2. Trigger a backup
3. Verify notification includes the specific database name from `databaseName` field

---

## Milestone 8: Update MySQL Backup Function
**Goal:** Pass database name from MySQL backup to notifications  
**Estimated Time:** 10 minutes  
**Files to Modify:**
- `packages/server/src/utils/backups/mysql.ts`

**Tasks:**
- [x] Add `databaseName: mysql.databaseName` to success notification call
- [x] Add `databaseName: mysql.databaseName` to error notification call

**Verification:**
- Code compiles without errors
- MySQL backup notifications include database name

**Manual Test:**
1. Create a MySQL database with a specific database name
2. Trigger a backup
3. Verify notification includes the specific database name from `databaseName` field

---

## Milestone 9: Update MariaDB Backup Function
**Goal:** Pass database name from MariaDB backup to notifications  
**Estimated Time:** 10 minutes  
**Files to Modify:**
- `packages/server/src/utils/backups/mariadb.ts`

**Tasks:**
- [x] Add `databaseName: mariadb.databaseName` to success notification call
- [x] Add `databaseName: mariadb.databaseName` to error notification call

**Verification:**
- Code compiles without errors
- MariaDB backup notifications include database name

**Manual Test:**
1. Create a MariaDB database with a specific database name
2. Trigger a backup
3. Verify notification includes the specific database name from `databaseName` field

---

## Milestone 10: Update MongoDB Backup Function
**Goal:** Pass database name from MongoDB backup to notifications  
**Estimated Time:** 15 minutes  
**Files to Modify:**
- `packages/server/src/utils/backups/mongo.ts`
- Note: MongoDB doesn't have a `databaseName` field - uses metadata from backup

**Tasks:**
- [x] Check MongoDB schema for database identifier
- [x] Extract database name from backup metadata or configuration
- [x] Add appropriate database identifier to success notification call
- [x] Add appropriate database identifier to error notification call
- Note: MongoDB doesn't have a databaseName field in schema - implementation uses applicationName as fallback

**Verification:**
- Code compiles without errors
- MongoDB backup notifications include meaningful database identifier

**Manual Test:**
1. Create a MongoDB instance
2. Trigger a backup
3. Verify notification includes meaningful database identifier
