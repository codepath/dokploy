#!/usr/bin/env node

// Test script for API schema trimming
const testApiTrimming = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // Test data with whitespace in IP address
  const testData = {
    name: 'Test Server API',
    description: 'Testing API schema trimming',
    ipAddress: '  192.168.1.100  ', // IP with leading and trailing spaces
    port: 22,
    username: 'root',
    sshKeyId: 'test-ssh-key-id' // We'll need a real one
  };

  console.log('🧪 Testing API Schema Trimming');
  console.log('📝 Input data:', JSON.stringify(testData, null, 2));
  
  try {
    // Make API call to create server
    const response = await fetch(`${baseUrl}/api/trpc/server.create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📤 Response status:', response.status);
    console.log('📤 Response data:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ API call successful - schema transformation worked');
    } else {
      console.log('❌ API call failed - check the error');
    }
    
  } catch (error) {
    console.error('❌ Error making API call:', error.message);
  }
};

// Run the test
testApiTrimming();
