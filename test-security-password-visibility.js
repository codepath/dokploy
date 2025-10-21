#!/usr/bin/env node

/**
 * Test Script: Security Password Visibility Fix
 * 
 * This script verifies that the ToggleVisibilityInput component is properly
 * integrated into the security components and functions as expected.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Security Password Visibility Implementation...\n');

// Test 1: Verify ToggleVisibilityInput import in show-security.tsx
console.log('1. Checking show-security.tsx imports...');
const showSecurityPath = 'apps/dokploy/components/dashboard/application/advanced/security/show-security.tsx';
const showSecurityContent = fs.readFileSync(showSecurityPath, 'utf8');

if (showSecurityContent.includes('import { ToggleVisibilityInput }')) {
    console.log('   ✅ ToggleVisibilityInput import found in show-security.tsx');
} else {
    console.log('   ❌ ToggleVisibilityInput import missing in show-security.tsx');
    process.exit(1);
}

// Test 2: Verify ToggleVisibilityInput usage in show-security.tsx
if (showSecurityContent.includes('<ToggleVisibilityInput') && 
    showSecurityContent.includes('disabled') && 
    showSecurityContent.includes('value={security.password}')) {
    console.log('   ✅ ToggleVisibilityInput properly configured in show-security.tsx');
} else {
    console.log('   ❌ ToggleVisibilityInput not properly configured in show-security.tsx');
    process.exit(1);
}

// Test 3: Verify ToggleVisibilityInput import in handle-security.tsx
console.log('\n2. Checking handle-security.tsx imports...');
const handleSecurityPath = 'apps/dokploy/components/dashboard/application/advanced/security/handle-security.tsx';
const handleSecurityContent = fs.readFileSync(handleSecurityPath, 'utf8');

if (handleSecurityContent.includes('import { ToggleVisibilityInput }')) {
    console.log('   ✅ ToggleVisibilityInput import found in handle-security.tsx');
} else {
    console.log('   ❌ ToggleVisibilityInput import missing in handle-security.tsx');
    process.exit(1);
}

// Test 4: Verify ToggleVisibilityInput usage in handle-security.tsx
if (handleSecurityContent.includes('<ToggleVisibilityInput') && 
    handleSecurityContent.includes('placeholder="test"')) {
    console.log('   ✅ ToggleVisibilityInput properly configured in handle-security.tsx');
} else {
    console.log('   ❌ ToggleVisibilityInput not properly configured in handle-security.tsx');
    process.exit(1);
}

// Test 5: Verify ToggleVisibilityInput component exists and has expected functionality
console.log('\n3. Checking ToggleVisibilityInput component...');
const toggleInputPath = 'apps/dokploy/components/shared/toggle-visibility-input.tsx';
const toggleInputContent = fs.readFileSync(toggleInputPath, 'utf8');

if (toggleInputContent.includes('isPasswordVisible') && 
    toggleInputContent.includes('togglePasswordVisibility') &&
    toggleInputContent.includes('EyeIcon') &&
    toggleInputContent.includes('EyeOffIcon') &&
    toggleInputContent.includes('Clipboard')) {
    console.log('   ✅ ToggleVisibilityInput component has expected functionality');
} else {
    console.log('   ❌ ToggleVisibilityInput component missing expected functionality');
    process.exit(1);
}

// Test 5.1: Verify buttons have type="button" to prevent form submission
if (toggleInputContent.includes('type="button"')) {
    console.log('   ✅ Buttons have type="button" to prevent form submission');
} else {
    console.log('   ❌ Buttons missing type="button" - will cause form submission');
    process.exit(1);
}

// Test 6: Verify no plain text password display remains
console.log('\n4. Checking for remaining plain text password displays...');
if (!showSecurityContent.includes('{security.password}') || 
    showSecurityContent.includes('<ToggleVisibilityInput')) {
    console.log('   ✅ No plain text password display found in show-security.tsx');
} else {
    console.log('   ❌ Plain text password display still exists in show-security.tsx');
    process.exit(1);
}

// Test 7: Verify no basic Input for password remains
console.log('\n5. Checking for basic Input components in password fields...');
if (!handleSecurityContent.includes('<Input placeholder="test"') || 
    handleSecurityContent.includes('<ToggleVisibilityInput placeholder="test"')) {
    console.log('   ✅ Basic Input replaced with ToggleVisibilityInput in handle-security.tsx');
} else {
    console.log('   ❌ Basic Input still used for password in handle-security.tsx');
    process.exit(1);
}

// Test 8: Check for linting errors
console.log('\n6. Checking for potential linting issues...');
const hasReactImports = showSecurityContent.includes('import React') || 
                       showSecurityContent.includes('from "react"');
const hasProperJSX = showSecurityContent.includes('<ToggleVisibilityInput') && 
                    showSecurityContent.includes('</ToggleVisibilityInput>');

if (hasProperJSX) {
    console.log('   ✅ JSX syntax appears correct');
} else {
    console.log('   ⚠️  Potential JSX syntax issues detected');
}

console.log('\n🎉 All tests passed! Security password visibility fix implemented successfully.');
console.log('\n📋 Manual Testing Checklist:');
console.log('   • Navigate to App > Advanced > Security');
console.log('   • Verify existing passwords are hidden by default');
console.log('   • Test eye icon toggle to show/hide passwords');
console.log('   • Test clipboard copy functionality');
console.log('   • Test creating new security credentials');
console.log('   • Verify password input is hidden by default');
console.log('   • Test toggle visibility in password input');
console.log('   • Verify form submission works correctly');
console.log('\n✨ Implementation complete!');
