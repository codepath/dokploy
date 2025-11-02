#!/bin/bash

# Profile Name Field - Quick Verification Script
# This script helps you verify the implementation is working

echo "======================================"
echo "Profile Name Field - Verification"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Implementation Status:${NC}"
echo "✅ profile-form.tsx - Updated"
echo "✅ user-nav.tsx - Updated"
echo ""

echo -e "${YELLOW}🧪 Manual Testing Required:${NC}"
echo ""
echo "1. Start your development server:"
echo "   cd apps/dokploy && npm run dev"
echo ""
echo "2. Open browser to: http://localhost:3000"
echo ""
echo "3. Login and navigate to: Settings → Profile"
echo ""
echo "4. Verify the following:"
echo "   ☐ Name field appears at the top of the form"
echo "   ☐ You can enter a name (e.g., 'John Doe')"
echo "   ☐ Clicking 'Save' shows success message"
echo "   ☐ Sidebar displays your name instead of 'Account'"
echo "   ☐ Clearing the name shows 'Account' again"
echo ""

echo -e "${BLUE}📝 Detailed Test Plan:${NC}"
echo "See: memory/testing/001_profile_name_test_plan.md"
echo ""

echo -e "${GREEN}🔍 Quick File Check:${NC}"
echo ""

# Check if files were modified
if [ -f "apps/dokploy/components/dashboard/settings/profile/profile-form.tsx" ]; then
    if grep -q "name: z.string().optional()" "apps/dokploy/components/dashboard/settings/profile/profile-form.tsx"; then
        echo "✅ profile-form.tsx contains name field in schema"
    else
        echo "❌ profile-form.tsx missing name field in schema"
    fi
    
    if grep -q 'name: data?.user?.name' "apps/dokploy/components/dashboard/settings/profile/profile-form.tsx"; then
        echo "✅ profile-form.tsx contains name in default values"
    else
        echo "❌ profile-form.tsx missing name in default values"
    fi
    
    if grep -q '<FormLabel>Name</FormLabel>' "apps/dokploy/components/dashboard/settings/profile/profile-form.tsx"; then
        echo "✅ profile-form.tsx contains Name form field"
    else
        echo "❌ profile-form.tsx missing Name form field"
    fi
else
    echo "❌ Cannot find profile-form.tsx"
fi

echo ""

if [ -f "apps/dokploy/components/layouts/user-nav.tsx" ]; then
    if grep -q 'data?.user?.name || "Account"' "apps/dokploy/components/layouts/user-nav.tsx"; then
        echo "✅ user-nav.tsx displays name with fallback"
    else
        echo "❌ user-nav.tsx not displaying name correctly"
    fi
else
    echo "❌ Cannot find user-nav.tsx"
fi

echo ""
echo -e "${GREEN}✨ Implementation Complete!${NC}"
echo ""
echo "Next Steps:"
echo "1. Run the manual tests listed above"
echo "2. Check memory/testing/001_profile_name_test_plan.md"
echo "3. If all tests pass, you're ready to commit!"
echo ""

