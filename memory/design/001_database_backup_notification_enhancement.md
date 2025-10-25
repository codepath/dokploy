# Database Backup Notification Enhancement Design Document

## Metadata
- **Status:** Draft
- **Author(s):** AI Assistant
- **Reviewers:** 
- **Created:** 2024-12-19
- **Updated:** 2024-12-19
- **Implementation PR(s):** 

## Overview
Database backup notifications currently lack specific database name information, making it difficult for users to identify which database was backed up when managing multiple databases. This enhancement will modify the backup notification system to include the actual database name in all notification channels, improving user experience and operational clarity.

The current notification system passes `applicationName` (which is the app/service name) but not the actual database name that users configure. For databases like PostgreSQL, MySQL, MariaDB, and MongoDB, the actual database name is stored in the `databaseName` field and should be prominently displayed in notifications.

## Goals
- Include specific database name in backup notifications across all channels (Email, Discord, Telegram, Slack, Gotify)
- Maintain backward compatibility with existing notification system
- Improve user experience for multi-database environments
- Provide clear audit trail for backup operations

## Proposed Solution

### High-Level Approach
Modify the `sendDatabaseBackupNotifications` function to accept and include the actual database name in notification messages. The database name is already available in the database schema (`databaseName` field) and can be passed from the backup functions to the notification system.

The solution involves:
1. Updating the notification function signature to accept `databaseName` parameter
2. Modifying all notification channel templates to include database name
3. Updating all backup functions to pass the database name to notifications
4. Ensuring consistent formatting across all notification channels

### Key Components
- **Database Backup Notification Function:** Core function that orchestrates notifications across all channels
- **Email Template:** React component for HTML email notifications
- **Channel-Specific Formatters:** Message formatting for Discord, Telegram, Slack, Gotify
- **Backup Functions:** Individual database backup implementations that call notifications

### Simple Architecture Diagram
```
[Backup Function] 
    ↓ (calls with databaseName)
[Notification Function]
    ↓ (formats with databaseName)
[Channel Handlers]
    ├── Email (HTML template)
    ├── Discord (embed)
    ├── Telegram (HTML message)
    ├── Slack (attachments)
    └── Gotify (title/message)
```

## Design Considerations

### 1. Database Name Display Format
**Context:** Need to decide how prominently to display the database name in notifications

**Options:**
- **Option A:** Include database name in main title/heading
  - Pros: Highly visible, clear identification
  - Cons: May make titles longer
- **Option B:** Include database name in details section only
  - Pros: Maintains current title structure
  - Cons: Less prominent, may be overlooked
- **Option C:** Include database name in both title and details
  - Pros: Maximum clarity and visibility
  - Cons: Redundant information

**Recommendation:** Option C - Include database name in both title and details for maximum clarity

### 2. Backward Compatibility
**Context:** Ensure existing notification configurations continue to work

**Options:**
- **Option A:** Make databaseName parameter optional with fallback
  - Pros: Backward compatible, graceful degradation
  - Cons: Additional complexity in function signature
- **Option B:** Require databaseName parameter
  - Pros: Simpler implementation, ensures consistency
  - Cons: Breaking change for existing code

**Recommendation:** Option A - Make databaseName optional with fallback to applicationName for backward compatibility

### 3. Message Length Considerations
**Context:** Some notification channels have character limits

**Options:**
- **Option A:** Truncate database names if too long
  - Pros: Prevents message truncation
  - Cons: May lose important information
- **Option B:** Use abbreviations for long database names
  - Pros: Maintains readability
  - Cons: May be confusing
- **Option C:** No truncation, let channels handle it naturally
  - Pros: Preserves all information
  - Cons: Risk of truncated messages

**Recommendation:** Option C - Let channels handle long messages naturally, as most database names are reasonably short

## Lifecycle of Code for Key Use Case

1. **User initiates backup:** Backup scheduled or manual backup triggered
2. **System validates:** Backup function validates database configuration
3. **Processing step:** Database backup command executed
4. **Data persistence:** Backup stored to destination
5. **Response to user:** Notification sent with database name included
6. **Post-processing (if any):** Cleanup and status updates

### Error Scenarios
- **If validation fails:** Error notification sent with database name for context
- **If external service is down:** Retry logic with database name in error messages
- **If database write fails:** Clear error notification identifying which database failed

## Detailed Design

### Schema Updates
No database schema changes required - the `databaseName` field already exists in all database tables (postgres, mysql, mariadb, mongo).

### API Endpoints
No new API endpoints required - this is an internal enhancement to the notification system.

### UI Changes
No UI changes required - this enhancement affects notification content only.

### Services / Business Logic

#### Updated Notification Function
```typescript
export const sendDatabaseBackupNotifications = async ({
	projectName,
	applicationName,
	databaseName, // NEW: Actual database name
	databaseType,
	type,
	errorMessage,
	organizationId,
}: {
	projectName: string;
	applicationName: string;
	databaseName?: string; // Optional for backward compatibility
	databaseType: "postgres" | "mysql" | "mongodb" | "mariadb";
	type: "error" | "success";
	organizationId: string;
	errorMessage?: string;
}) => {
	// Use databaseName if provided, fallback to applicationName
	const displayName = databaseName || applicationName;
	
	// Update all notification channels to include displayName
	// ... rest of implementation
}
```

#### Updated Email Template
```tsx
export const DatabaseBackupEmail = ({
	projectName = "dokploy",
	applicationName = "frontend",
	databaseName, // NEW: Actual database name
	databaseType = "postgres",
	type = "success",
	errorMessage,
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const displayName = databaseName || applicationName;
	
	return (
		<Html>
			<Heading>
				Database backup for <strong>{displayName}</strong>
			</Heading>
			<Text>
				Your database backup for <strong>{displayName}</strong> was {type === "success" ? "successful ✅" : "failed ❌"}
			</Text>
			<Section>
				<Text>Database Name: <strong>{displayName}</strong></Text>
				<Text>Application Name: <strong>{applicationName}</strong></Text>
				{/* ... rest of details */}
			</Section>
		</Html>
	);
};
```

#### Updated Backup Functions
```typescript
// Example for PostgreSQL backup
await sendDatabaseBackupNotifications({
	applicationName: name,
	databaseName: postgres.databaseName, // NEW: Pass actual database name
	projectName: project.name,
	databaseType: "postgres",
	type: "success",
	organizationId: project.organizationId,
});
```

### Data Migration Plan
No data migration required - this is a code-only enhancement.

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing notifications | High | Low | Make databaseName parameter optional with fallback |
| Message length issues | Medium | Low | Test with long database names, let channels handle naturally |
| Inconsistent formatting across channels | Medium | Medium | Implement consistent formatting in all channel handlers |
| Performance impact | Low | Low | No additional database queries required |

### Technical Debt
- Consider consolidating notification formatting logic into shared utilities
- Evaluate if notification templates should be externalized for easier maintenance

## Rollout Plan

### Deployment Strategy
- [ ] Feature flag implementation: Not required for this enhancement
- [ ] Canary deployment percentage: 100% - safe enhancement with backward compatibility
- [ ] Full rollout criteria: All backup functions updated to pass databaseName

### Rollback Plan
Simple rollback by reverting the code changes - no database schema changes to rollback.

### Monitoring & Alerts
- **Key metrics:** Notification delivery success rates
- **Alert thresholds:** Monitor for notification failures
- **Dashboards:** Existing notification monitoring dashboards

## Open Questions
1. Should we also include database name in other notification types (deploy, build error, etc.)?
2. Should we add database name to the backup history/logs as well?
3. Do we need to consider internationalization for database names in notifications?

## References
- Current notification system: `packages/server/src/utils/notifications/database-backup.ts`
- Email template: `packages/server/src/emails/emails/database-backup.tsx`
- Database schemas: `packages/server/src/db/schema/`
- Backup functions: `packages/server/src/utils/backups/`
