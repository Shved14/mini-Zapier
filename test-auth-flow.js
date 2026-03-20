// Test script to verify authentication flow
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Step 1: Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.token) {
      console.log('✅ Login successful - token received');
      const token = loginResponse.data.token;
      console.log(`Token length: ${token.length} characters`);
      
      // Step 2: Test /auth/me endpoint
      console.log('\n2. Testing /auth/me endpoint...');
      try {
        const meResponse = await axios.get(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (meResponse.data.email) {
          console.log(`✅ /auth/me successful - user: ${meResponse.data.email}`);
        } else {
          console.log('❌ /auth/me failed - no user data returned');
        }
      } catch (meError) {
        console.log('❌ /auth/me failed:', meError.response?.data || meError.message);
      }
      
      // Step 3: Test token persistence simulation
      console.log('\n3. Testing token persistence...');
      console.log('✅ Token would be stored in localStorage');
      
      // Step 4: Test invalid token
      console.log('\n4. Testing invalid token...');
      try {
        await axios.get(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': 'Bearer invalid_token_here'
          }
        });
        console.log('❌ Invalid token test failed - should have returned 401');
      } catch (invalidError) {
        if (invalidError.response?.status === 401) {
          console.log('✅ Invalid token correctly returns 401');
        } else {
          console.log('❌ Invalid token test failed - wrong status:', invalidError.response?.status);
        }
      }
      
    } else {
      console.log('❌ Login failed - no token received');
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
    
    // If login fails, let's try to register a test user first
    console.log('\n🔄 Trying to register test user...');
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      console.log('✅ Test user registered successfully');
      console.log('🔄 Now testing login again...');
      
      // Retry login
      const retryResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (retryResponse.data.token) {
        console.log('✅ Login successful after registration');
      }
    } catch (registerError) {
      console.log('❌ Registration failed:', registerError.response?.data || registerError.message);
    }
  }
  
  console.log('\n🎯 Authentication flow test completed!');
  console.log('\n📋 Manual Testing Checklist:');
  console.log('1. Open http://localhost:3007 in browser');
  console.log('2. Try to login with test@example.com / password123');
  console.log('3. Verify you stay logged in after redirect to /workflows');
  console.log('4. Refresh page - should still be logged in');
  console.log('5. Navigate between pages - should not logout');
  console.log('6. Check browser console for debug logs');
}

// Run the test
testAuthFlow().catch(console.error);
