# Issue 6: Security Password Visibility Bug

## Bug Description
In the App > Advanced > Security view, basic authentication passwords are displayed in plain text instead of being hidden behind visibility toggles, creating security risks and inconsistent UX.

## Current vs Expected Behavior
- **Current:** Password visible as plain text
- **Expected:** Password hidden by default with toggle visibility + copy functionality

## Breakdown into 2 Issues

### Issue 1: Password Input Field in Security Form (Create/Edit Dialog)
**Priority:** High - Affects credential creation/editing

### Issue 2: Password Display in Security List View  
**Priority:** High - Affects credential viewing

---

## Issue 1 Deep Dive

### Location & Affected Code
**File:** `apps/dokploy/components/dashboard/application/advanced/security/handle-security.tsx`  
**Lines:** 147-160

### Problem Code
```tsx
<FormField
    control={form.control}
    name="password"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
                <Input placeholder="test" {...field} />  // ❌ Plain text input
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
/>
```

### Root Cause
- Using basic `<Input>` component without password protection
- Missing `type="password"` attribute
- No visibility toggle functionality

### Solution Approach
Replace `<Input>` with existing `<ToggleVisibilityInput>` component that provides:
- Hidden password by default (dots/asterisks)
- Eye icon toggle to show/hide
- Copy-to-clipboard functionality

### Files to Modify
1. `handle-security.tsx` - Add import and replace Input component

### Required Changes
```tsx
// Add import (line 20)
import { ToggleVisibilityInput } from "@/components/shared/toggle-visibility-input";

// Replace Input with ToggleVisibilityInput (line 154)
<ToggleVisibilityInput placeholder="test" {...field} />
```

### Testing Steps
1. Navigate to App > Advanced > Security
2. Click "Add Security" button
3. **Verify:** Password field shows dots (••••) by default
4. **Verify:** Click eye icon reveals password
5. **Verify:** Click eye again hides password  
6. **Verify:** Click copy icon copies password to clipboard
7. **Verify:** Form submission works correctly

### Success Criteria
- Password hidden by default
- Toggle visibility works
- Copy functionality works
- Form validation unchanged
- Consistent with other password fields in app

---

## New Bug Discovered: Form Submission Issue

### Bug Description
After implementing the fix, clicking the eye icon or copy button in `ToggleVisibilityInput` submits the form instead of toggling visibility or copying to clipboard.

### Root Cause
HTML buttons inside `<form>` elements default to `type="submit"`. The `ToggleVisibilityInput` component buttons are missing `type="button"` attribute.

### Fix Plan
Add `type="button"` to both buttons in `ToggleVisibilityInput` component:
```tsx
<Button type="button" onClick={togglePasswordVisibility} variant={"secondary"}>
<Button type="button" onClick={copyToClipboard} variant={"secondary"}>
```

### Files to Modify
- `apps/dokploy/components/shared/toggle-visibility-input.tsx` (lines 20, 29)

---

## Impact Analysis: Features Using ToggleVisibilityInput

### Currently Used In (11 locations):
1. **Application Security Form** - ❌ AFFECTED (inside form)
2. **Redis Internal Credentials** - ✅ Safe (display-only)
3. **Redis External Credentials** - ✅ Safe (display-only)
4. **PostgreSQL Internal Credentials** - ✅ Safe (display-only)
5. **PostgreSQL External Credentials** - ✅ Safe (display-only)
6. **MySQL Internal Credentials** - ✅ Safe (display-only)
7. **MySQL External Credentials** - ✅ Safe (display-only)
8. **MongoDB Internal Credentials** - ✅ Safe (display-only)
9. **MongoDB External Credentials** - ✅ Safe (display-only)
10. **MariaDB Internal Credentials** - ✅ Safe (display-only)
11. **MariaDB External Credentials** - ✅ Safe (display-only)

### Why Fix is Safe
- **10/11 usages** are display-only views (not inside forms)
- Only **1 usage** (Security form) is inside a form and affected
- Adding `type="button"` makes buttons safer for future form usage
- No breaking changes to existing display views

---

## Regression Testing Steps

### High Priority (Security Form)
1. Navigate to App > Advanced > Security
2. Click "Add Security" or edit existing
3. **Verify:** Eye icon toggles visibility (doesn't submit form)
4. **Verify:** Copy icon copies to clipboard (doesn't submit form)
5. **Verify:** Only "Update/Create" button submits form

### Low Priority (Database Credential Views)
1. Navigate to any database (Postgres/MySQL/MariaDB/MongoDB/Redis)
2. Go to General tab > Credentials section
3. **Verify:** Eye icon still toggles password visibility
4. **Verify:** Copy icon still copies to clipboard
5. **Verify:** No unexpected behavior changes

---

## Issue 2 Deep Dive: Password Display in Security List View

### Location & Affected Code
**File:** `apps/dokploy/components/dashboard/application/advanced/security/show-security.tsx`  
**Lines:** 69-74

### Problem Code
```tsx
<div className="flex flex-col gap-1">
    <span className="font-medium">Password</span>
    <span className="text-sm text-muted-foreground">
        {security.password}  // ❌ Plain text display
    </span>
</div>
```

### Root Cause
- Using plain `<span>` element to display password
- No visibility toggle or copy functionality
- Password exposed as plain text in the credentials list view

### Solution Approach
Replace `<span>` with `ToggleVisibilityInput` component using `disabled` prop:
- Hidden password by default (dots/asterisks)
- Eye icon toggle to show/hide
- Copy-to-clipboard functionality
- Read-only mode (can't edit, only view/copy)

### Files to Modify
1. `show-security.tsx` - Add import and replace span with ToggleVisibilityInput

### Required Changes
```tsx
// Add import (line 1)
import { ToggleVisibilityInput } from "@/components/shared/toggle-visibility-input";

// Replace span with ToggleVisibilityInput (lines 69-74)
<div className="flex flex-col gap-1">
    <span className="font-medium">Password</span>
    <ToggleVisibilityInput 
        value={security.password}
        disabled
    />
</div>
```

### Consistency with Other Features
This fix follows the **exact same pattern** used in database credential views:

**MySQL credentials example:**
```tsx
<ToggleVisibilityInput
    disabled
    value={data?.databasePassword}
/>
```

**Security password display (after fix):**
```tsx
<ToggleVisibilityInput 
    value={security.password}
    disabled
/>
```

Both use:
- Same `ToggleVisibilityInput` component
- Same `disabled` prop for read-only display
- Same `value` prop for the password data
- Same security features (toggle visibility + copy)

### Testing Steps
1. Navigate to App > Advanced > Security
2. Ensure at least one security credential exists (create one if needed)
3. **Verify:** Password shows as dots (••••) by default
4. **Verify:** Click eye icon reveals password text
5. **Verify:** Click eye icon again hides password back to dots
6. **Verify:** Click copy icon copies password to clipboard with success toast
7. **Verify:** Input is disabled (can't type/edit)
8. **Verify:** Username field remains unchanged (plain text display)

### Success Criteria
- Password hidden by default in list view
- Toggle visibility works for existing credentials
- Copy functionality works for existing credentials
- Consistent with database credential display patterns
- No impact on edit functionality (handled separately in Issue 1)
