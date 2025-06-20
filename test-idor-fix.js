const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUsers = [
  {
    email: 'bryant@gmail.com',
    password: 'password123',
    name: 'Bryant (User 4)'
  },
  {
    email: 'gibril1435@gmail.com', 
    password: 'password123',
    name: 'Gibril (User 5)'
  }
];

let userTokens = {};

async function loginUser(user) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password
    });
    
    userTokens[user.name] = response.data.token;
    console.log(`✅ ${user.name} logged in successfully`);
    return response.data.token;
  } catch (error) {
    console.error(`❌ Failed to login ${user.name}:`, error.response?.data || error.message);
    return null;
  }
}

async function getBookingHistory(userName, token) {
  try {
    const response = await axios.get(`${BASE_URL}/booking/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`📋 ${userName} booking history:`, response.data.length, 'bookings');
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to get booking history for ${userName}:`, error.response?.data || error.message);
    return null;
  }
}

async function testIDORFix() {
  console.log('🔒 Testing IDOR Vulnerability Fix\n');
  
  // Step 1: Login both users
  console.log('Step 1: Logging in users...');
  for (const user of testUsers) {
    await loginUser(user);
  }
  
  console.log('\nStep 2: Testing booking history access...\n');
  
  // Step 2: Get booking history for each user
  const histories = {};
  for (const user of testUsers) {
    const token = userTokens[user.name];
    if (token) {
      const history = await getBookingHistory(user.name, token);
      histories[user.name] = history;
    }
  }
  
  // Step 3: Analyze results
  console.log('\nStep 3: Analyzing results...\n');
  
  const bryantHistory = histories['Bryant (User 4)'];
  const gibrilHistory = histories['Gibril (User 5)'];
  
  if (bryantHistory && gibrilHistory) {
    console.log('📊 Results:');
    console.log(`- Bryant has ${bryantHistory.length} bookings`);
    console.log(`- Gibril has ${gibrilHistory.length} bookings`);
    
    // Check if Gibril can see Bryant's bookings (IDOR vulnerability)
    const bryantBookingIds = bryantHistory.map(b => b.id);
    const gibrilBookingIds = gibrilHistory.map(b => b.id);
    
    const sharedBookings = bryantBookingIds.filter(id => gibrilBookingIds.includes(id));
    
    if (sharedBookings.length > 0) {
      console.log('❌ IDOR VULNERABILITY STILL EXISTS!');
      console.log(`Gibril can see ${sharedBookings.length} of Bryant's bookings:`, sharedBookings);
    } else {
      console.log('✅ IDOR VULNERABILITY FIXED!');
      console.log('Users can only see their own bookings.');
    }
    
    // Show sample booking data for verification
    if (bryantHistory.length > 0) {
      console.log('\n📋 Sample Bryant booking:');
      console.log(JSON.stringify(bryantHistory[0], null, 2));
    }
    
    if (gibrilHistory.length > 0) {
      console.log('\n📋 Sample Gibril booking:');
      console.log(JSON.stringify(gibrilHistory[0], null, 2));
    }
  } else {
    console.log('❌ Could not retrieve booking histories for comparison');
  }
  
  console.log('\n🔍 Additional Security Checks:');
  
  // Test with invalid token
  try {
    await axios.get(`${BASE_URL}/booking/history`, {
      headers: {
        'Authorization': 'Bearer invalid_token'
      }
    });
    console.log('❌ Invalid token was accepted!');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid tokens are properly rejected');
    } else {
      console.log('❌ Unexpected error with invalid token:', error.response?.status);
    }
  }
  
  // Test without token
  try {
    await axios.get(`${BASE_URL}/booking/history`);
    console.log('❌ Request without token was accepted!');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Requests without tokens are properly rejected');
    } else {
      console.log('❌ Unexpected error without token:', error.response?.status);
    }
  }
  
  console.log('\n🏁 IDOR Vulnerability Test Complete');
}

// Run the test
testIDORFix().catch(console.error); 