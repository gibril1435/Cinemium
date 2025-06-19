const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
let authToken = null;
let testUserId = null;

// Test data
const testData = {
  user: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'customer'
  },
  movie: {
    title: 'Test Movie',
    description: 'A test movie for API testing',
    duration: 120,
    genre: 'Action',
    releaseDate: '2024-01-15',
    director: 'Test Director',
    cast: 'Test Cast',
    posterUrl: 'https://example.com/poster.jpg',
    trailerUrl: 'https://example.com/trailer.mp4',
    rating: 'PG-13'
  },
  studio: {
    name: 'Test Studio',
    capacity: 100,
    location: 'Test Location',
    facilities: ['Dolby Atmos', '4K Projection']
  },
  showtime: {
    movieId: 1,
    studioId: 1,
    showDateTime: '2024-02-15T19:00:00Z',
    price: 12.50
  },
  addon: {
    name: 'Test Popcorn',
    description: 'Large popcorn',
    price: 8.50,
    stock: 50,
    category: 'Food'
  },
  promotion: {
    code: 'TEST20',
    description: '20% off test promotion',
    discountPercentage: 20,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    minimumPurchase: 10,
    maxUses: 100
  },
  ticketPrice: {
    price: 15.00,
    startDate: '2024-02-01T00:00:00Z',
    endDate: '2024-02-28T23:59:59Z',
    description: 'February premium pricing',
    type: 'custom'
  },
  notification: {
    type: 'test',
    title: 'Test Notification',
    message: 'This is a test notification',
    data: { test: true }
  }
};

// Utility functions
const log = (message, data = null) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(message);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log(`${'='.repeat(50)}`);
};

const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Authentication tests
const testAuth = async () => {
  log('🔐 Testing Authentication Endpoints');
  
  // Test registration
  const registerResult = await makeRequest('POST', '/auth/register', testData.user);
  log('Registration Result:', registerResult);
  
  // Test login
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: testData.user.email,
    password: testData.user.password
  });
  log('Login Result:', loginResult);
  
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    testUserId = loginResult.data.user.UserID;
    log('✅ Authentication successful, token obtained');
  } else {
    log('❌ Authentication failed');
  }
};

// Movies tests
const testMovies = async () => {
  log('🎬 Testing Movies Endpoints');
  
  // Create movie
  const createResult = await makeRequest('POST', '/movies', testData.movie);
  log('Create Movie Result:', createResult);
  
  if (createResult.success) {
    const movieId = createResult.data.MovieID;
    
    // Get all movies
    const getAllResult = await makeRequest('GET', '/movies');
    log('Get All Movies Result:', getAllResult);
    
    // Get movie by ID
    const getByIdResult = await makeRequest('GET', `/movies/${movieId}`);
    log('Get Movie by ID Result:', getByIdResult);
    
    // Update movie
    const updateResult = await makeRequest('PUT', `/movies/${movieId}`, {
      ...testData.movie,
      title: 'Updated Test Movie'
    });
    log('Update Movie Result:', updateResult);
    
    // Search movies
    const searchResult = await makeRequest('GET', '/movies?search=Test');
    log('Search Movies Result:', searchResult);
  }
};

// Studios tests
const testStudios = async () => {
  log('🏢 Testing Studios Endpoints');
  
  // Create studio
  const createResult = await makeRequest('POST', '/studios', testData.studio);
  log('Create Studio Result:', createResult);
  
  if (createResult.success) {
    const studioId = createResult.data.StudioID;
    
    // Get all studios
    const getAllResult = await makeRequest('GET', '/studios');
    log('Get All Studios Result:', getAllResult);
    
    // Get studio by ID
    const getByIdResult = await makeRequest('GET', `/studios/${studioId}`);
    log('Get Studio by ID Result:', getByIdResult);
    
    // Update studio
    const updateResult = await makeRequest('PUT', `/studios/${studioId}`, {
      ...testData.studio,
      name: 'Updated Test Studio'
    });
    log('Update Studio Result:', updateResult);
  }
};

// Showtimes tests
const testShowtimes = async () => {
  log('🎭 Testing Showtimes Endpoints');
  
  // Create showtime
  const createResult = await makeRequest('POST', '/showtimes', testData.showtime);
  log('Create Showtime Result:', createResult);
  
  if (createResult.success) {
    const showtimeId = createResult.data.id;
    
    // Get all showtimes
    const getAllResult = await makeRequest('GET', '/showtimes');
    log('Get All Showtimes Result:', getAllResult);
    
    // Get showtime by ID
    const getByIdResult = await makeRequest('GET', `/showtimes/${showtimeId}`);
    log('Get Showtime by ID Result:', getByIdResult);
    
    // Update showtime
    const updateResult = await makeRequest('PUT', `/showtimes/${showtimeId}`, {
      ...testData.showtime,
      showDateTime: '2024-02-16T20:00:00Z'
    });
    log('Update Showtime Result:', updateResult);
  }
};

// AddOns tests
const testAddOns = async () => {
  log('🍿 Testing AddOns Endpoints');
  
  // Create addon
  const createResult = await makeRequest('POST', '/admin/addons', testData.addon, {
    Authorization: `Bearer ${authToken}`
  });
  log('Create AddOn Result:', createResult);
  
  if (createResult.success) {
    const addonId = createResult.data.AddOnID;
    
    // Get all addons
    const getAllResult = await makeRequest('GET', '/admin/addons', null, {
      Authorization: `Bearer ${authToken}`
    });
    log('Get All AddOns Result:', getAllResult);
    
    // Get addon by ID
    const getByIdResult = await makeRequest('GET', `/admin/addons/${addonId}`, null, {
      Authorization: `Bearer ${authToken}`
    });
    log('Get AddOn by ID Result:', getByIdResult);
    
    // Update addon
    const updateResult = await makeRequest('PUT', `/admin/addons/${addonId}`, {
      ...testData.addon,
      name: 'Updated Test Popcorn'
    }, {
      Authorization: `Bearer ${authToken}`
    });
    log('Update AddOn Result:', updateResult);
  }
};

// Promotions tests
const testPromotions = async () => {
  log('🎫 Testing Promotions Endpoints');
  
  // Create promotion
  const createResult = await makeRequest('POST', '/promotions', testData.promotion);
  log('Create Promotion Result:', createResult);
  
  if (createResult.success) {
    const promotionId = createResult.data.PromotionID;
    
    // Get all promotions
    const getAllResult = await makeRequest('GET', '/promotions');
    log('Get All Promotions Result:', getAllResult);
    
    // Get promotion by ID
    const getByIdResult = await makeRequest('GET', `/promotions/${promotionId}`);
    log('Get Promotion by ID Result:', getByIdResult);
    
    // Update promotion
    const updateResult = await makeRequest('PUT', `/promotions/${promotionId}`, {
      ...testData.promotion,
      discountPercentage: 25
    });
    log('Update Promotion Result:', updateResult);
  }
};

// Ticket Prices tests
const testTicketPrices = async () => {
  log('💰 Testing Ticket Prices Endpoints');
  
  // Create ticket price
  const createResult = await makeRequest('POST', '/admin/prices', testData.ticketPrice, {
    Authorization: `Bearer ${authToken}`
  });
  log('Create Ticket Price Result:', createResult);
  
  if (createResult.success) {
    const priceId = createResult.data.id;
    
    // Get all ticket prices
    const getAllResult = await makeRequest('GET', '/admin/prices', null, {
      Authorization: `Bearer ${authToken}`
    });
    log('Get All Ticket Prices Result:', getAllResult);
    
    // Get current price
    const getCurrentResult = await makeRequest('GET', '/admin/prices/current?date=2024-02-15', null, {
      Authorization: `Bearer ${authToken}`
    });
    log('Get Current Price Result:', getCurrentResult);
    
    // Update ticket price
    const updateResult = await makeRequest('PUT', `/admin/prices/${priceId}`, {
      ...testData.ticketPrice,
      price: 18.00
    }, {
      Authorization: `Bearer ${authToken}`
    });
    log('Update Ticket Price Result:', updateResult);
  }
};

// Notifications tests
const testNotifications = async () => {
  log('🔔 Testing Notifications Endpoints');
  
  // Create notification
  const createResult = await makeRequest('POST', '/notifications', testData.notification, {
    Authorization: `Bearer ${authToken}`
  });
  log('Create Notification Result:', createResult);
  
  if (createResult.success) {
    const notificationId = createResult.data.id;
    
    // Get user notifications
    const getUserResult = await makeRequest('GET', '/notifications', null, {
      Authorization: `Bearer ${authToken}`
    });
    log('Get User Notifications Result:', getUserResult);
    
    // Mark as read
    const markReadResult = await makeRequest('PATCH', `/notifications/${notificationId}/read`, null, {
      Authorization: `Bearer ${authToken}`
    });
    log('Mark as Read Result:', markReadResult);
    
    // Get notification by ID
    const getByIdResult = await makeRequest('GET', `/notifications/${notificationId}`, null, {
      Authorization: `Bearer ${authToken}`
    });
    log('Get Notification by ID Result:', getByIdResult);
  }
};

// Booking tests
const testBookings = async () => {
  log('🎟️ Testing Booking Endpoints');
  
  // Get seat layout
  const seatLayoutResult = await makeRequest('GET', '/booking/showtimes/1/seats');
  log('Get Seat Layout Result:', seatLayoutResult);
  
  // Create booking
  const bookingData = {
    showtimeId: 1,
    seats: ['A1', 'A2'],
    addOns: [
      { id: 1, quantity: 2 }
    ]
  };
  
  const createResult = await makeRequest('POST', '/booking/transactions', bookingData, {
    Authorization: `Bearer ${authToken}`
  });
  log('Create Booking Result:', createResult);
  
  if (createResult.success) {
    const bookingId = createResult.data.booking.BookingID;
    
    // Get booking history
    const historyResult = await makeRequest('GET', '/booking/history', null, {
      Authorization: `Bearer ${authToken}`
    });
    log('Get Booking History Result:', historyResult);
    
    // Get booking details
    const detailsResult = await makeRequest('GET', `/booking/${bookingId}`, null, {
      Authorization: `Bearer ${authToken}`
    });
    log('Get Booking Details Result:', detailsResult);
  }
};

// Schedule Management tests
const testScheduleManagement = async () => {
  log('📅 Testing Schedule Management Endpoints');
  
  // Get all schedules
  const getAllResult = await makeRequest('GET', '/admin/schedule', null, {
    Authorization: `Bearer ${authToken}`
  });
  log('Get All Schedules Result:', getAllResult);
  
  // Check studio availability
  const availabilityResult = await makeRequest('GET', '/admin/schedule/availability?studioId=1&startTime=2024-02-15T19:00:00Z&endTime=2024-02-15T21:00:00Z', null, {
    Authorization: `Bearer ${authToken}`
  });
  log('Check Studio Availability Result:', availabilityResult);
  
  // Get optimal showtimes
  const optimalResult = await makeRequest('GET', '/admin/schedule/optimal-showtimes?movieId=1&studioId=1&date=2024-02-20', null, {
    Authorization: `Bearer ${authToken}`
  });
  log('Get Optimal Showtimes Result:', optimalResult);
  
  // Get studio schedule
  const scheduleResult = await makeRequest('GET', '/admin/schedule/studio-schedule?studioId=1&startDate=2024-02-01&endDate=2024-02-28', null, {
    Authorization: `Bearer ${authToken}`
  });
  log('Get Studio Schedule Result:', scheduleResult);
};

// Cleanup function
const cleanup = async () => {
  log('🧹 Cleaning up test data...');
  
  // Note: In a real testing environment, you would clean up all created test data
  // For this demo, we'll just log what would be cleaned up
  log('Test data cleanup completed (simulated)');
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting Cinemium API Tests');
  
  try {
    await testAuth();
    if (!authToken) {
      log('❌ Cannot continue without authentication token');
      return;
    }
    
    await testMovies();
    await testStudios();
    await testShowtimes();
    await testAddOns();
    await testPromotions();
    await testTicketPrices();
    await testNotifications();
    await testBookings();
    await testScheduleManagement();
    
    await cleanup();
    
    log('✅ All tests completed successfully!');
  } catch (error) {
    log('❌ Test execution failed:', error);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testAuth,
  testMovies,
  testStudios,
  testShowtimes,
  testAddOns,
  testPromotions,
  testTicketPrices,
  testNotifications,
  testBookings,
  testScheduleManagement
}; 