const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Simple test function
const testEndpoint = async (method, endpoint, data = null, description = '') => {
  try {
    console.log(`\n🧪 Testing: ${description || `${method} ${endpoint}`}`);
    
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    console.log(`✅ Success (${response.status}):`, response.data);
    return true;
  } catch (error) {
    console.log(`❌ Error (${error.response?.status || 'Network'}):`, error.response?.data || error.message);
    return false;
  }
};

// Run quick tests
const runQuickTests = async () => {
  console.log('🚀 Starting Quick API Tests for Cinemium\n');
  
  // Test public endpoints
  await testEndpoint('GET', '/movies', null, 'Get all movies');
  await testEndpoint('GET', '/studios', null, 'Get all studios');
  await testEndpoint('GET', '/showtimes', null, 'Get all showtimes');
  await testEndpoint('GET', '/promotions', null, 'Get all promotions');
  
  // Test authentication
  await testEndpoint('POST', '/auth/register', {
    username: 'quicktest',
    email: 'quick@test.com',
    password: 'password123',
    role: 'customer'
  }, 'Register new user');
  
  await testEndpoint('POST', '/auth/login', {
    email: 'quick@test.com',
    password: 'password123'
  }, 'Login user');
  
  console.log('\n🎉 Quick tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run full test suite: node test-api.js');
  console.log('2. Use Postman collection: Cinemium_API.postman_collection.json');
  console.log('3. Follow manual testing guide: API_TESTING_GUIDE.md');
};

// Run if called directly
if (require.main === module) {
  runQuickTests().catch(console.error);
}

module.exports = { runQuickTests, testEndpoint }; 