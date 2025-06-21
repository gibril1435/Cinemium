# Cinemium API Testing Guide

This guide provides comprehensive testing instructions for the Cinemium API endpoints.

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
npm start
```
The server should start on `http://localhost:5000`

### 2. Run Automated Tests
```bash
node test-api.js
```

### 3. Manual Testing with cURL

## 📋 Manual Testing Examples

### Authentication

#### Register a new user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "customer"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Save the token from the response for authenticated requests.**

### Movies

#### Get all movies
```bash
curl -X GET http://localhost:5000/api/movies
```

#### Create a movie
```bash
curl -X POST http://localhost:5000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Movie",
    "description": "A test movie for API testing",
    "duration": 120,
    "genre": "Action",
    "releaseDate": "2024-01-15",
    "director": "Test Director",
    "cast": "Test Cast",
    "posterUrl": "https://example.com/poster.jpg",
    "trailerUrl": "https://example.com/trailer.mp4",
    "rating": "PG-13"
  }'
```

#### Get movie by ID
```bash
curl -X GET http://localhost:5000/api/movies/1
```

#### Update movie
```bash
curl -X PUT http://localhost:5000/api/movies/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Movie",
    "description": "Updated description"
  }'
```

#### Search movies
```bash
curl -X GET "http://localhost:5000/api/movies?search=Test&genre=Action"
```

### Studios

#### Get all studios
```bash
curl -X GET http://localhost:5000/api/studios
```

#### Create a studio
```bash
curl -X POST http://localhost:5000/api/studios \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Studio",
    "capacity": 100,
    "location": "Test Location",
    "facilities": ["Dolby Atmos", "4K Projection"]
  }'
```

#### Get studio by ID
```bash
curl -X GET http://localhost:5000/api/studios/1
```

### Showtimes

#### Get all showtimes
```bash
curl -X GET http://localhost:5000/api/showtimes
```

#### Create a showtime
```bash
curl -X POST http://localhost:5000/api/showtimes \
  -H "Content-Type: application/json" \
  -d '{
    "movieId": 1,
    "studioId": 1,
    "showDateTime": "2024-02-15T19:00:00Z",
    "price": 12.50
  }'
```

### AddOns (Admin Only)

#### Get all addons
```bash
curl -X GET http://localhost:5000/api/admin/addons \
  -H "Authorization: Bearer "aalegknliaehinaejn"
```

#### Create an addon
```bash
curl -X POST http://localhost:5000/api/admin/addons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Popcorn",
    "description": "Large popcorn",
    "price": 8.50,
    "stock": 50,
    "category": "Food"
  }'
```

### Promotions

#### Get all promotions
```bash
curl -X GET http://localhost:5000/api/promotions
```

#### Create a promotion
```bash
curl -X POST http://localhost:5000/api/promotions \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST20",
    "description": "20% off test promotion",
    "discountPercentage": 20,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "minimumPurchase": 10,
    "maxUses": 100
  }'
```

### Ticket Prices (Admin Only)

#### Get all ticket prices
```bash
curl -X GET http://localhost:5000/api/admin/prices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Create a ticket price
```bash
curl -X POST http://localhost:5000/api/admin/prices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "price": 15.00,
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-02-28T23:59:59Z",
    "description": "February premium pricing",
    "type": "custom"
  }'
```

#### Get current price for a date
```bash
curl -X GET "http://localhost:5000/api/admin/prices/current?date=2024-02-15" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Notifications

#### Get user notifications
```bash
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Create a notification
```bash
curl -X POST http://localhost:5000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "type": "test",
    "title": "Test Notification",
    "message": "This is a test notification",
    "data": {"test": true}
  }'
```

#### Mark notification as read
```bash
curl -X PATCH http://localhost:5000/api/notifications/1/read \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Booking

#### Get seat layout for a showtime
```bash
curl -X GET http://localhost:5000/api/booking/showtimes/1/seats
```

#### Create a booking

Use the following endpoint to create a new booking:

POST /api/booking/transactions

Example:
curl -X POST http://localhost:5000/api/booking/transactions \
  -H "Content-Type: application/json" \
  -d '{"showtimeId": "1", "seatIds": ["A1", "A2"], "addOns": [{"id": 1, "quantity": 2}]}'

#### Get booking history
```bash
curl -X GET http://localhost:5000/api/booking/history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Get booking details
```bash
curl -X GET http://localhost:5000/api/booking/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Schedule Management (Admin Only)

#### Get all schedules
```bash
curl -X GET http://localhost:5000/api/admin/schedule \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Check studio availability
```bash
curl -X GET "http://localhost:5000/api/admin/schedule/availability?studioId=1&startTime=2024-02-15T19:00:00Z&endTime=2024-02-15T21:00:00Z" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Get optimal showtimes
```bash
curl -X GET "http://localhost:5000/api/admin/schedule/optimal-showtimes?movieId=1&studioId=1&date=2024-02-20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Get studio schedule
```bash
curl -X GET "http://localhost:5000/api/admin/schedule/studio-schedule?studioId=1&startDate=2024-02-01&endDate=2024-02-28" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🧪 Testing Tools

### 1. Automated Testing Script
Run the comprehensive test suite:
```bash
node test-api.js
```

### 2. Postman Collection
Import the following endpoints into Postman:

**Base URL:** `http://localhost:5000/api`

**Environment Variables:**
- `baseUrl`: `http://localhost:5000/api`
- `token`: (set after login)

### 3. Browser Testing
For GET requests, you can test directly in the browser:
- `http://localhost:5000/api/movies`
- `http://localhost:5000/api/studios`
- `http://localhost:5000/api/showtimes`

## 📊 Expected Responses

### Successful Response Format
```json
{
  "success": true,
  "data": {...},
  "status": 200
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error description"
  },
  "status": 400
}
```

## 🔍 Common Test Scenarios

### 1. CRUD Operations
- Create → Read → Update → Delete
- Verify data persistence
- Check ID generation

### 2. Authentication
- Register new user
- Login and get token
- Use token for protected endpoints
- Test invalid credentials

### 3. Data Validation
- Test required fields
- Test invalid data types
- Test business rules (e.g., seat availability)

### 4. Relationships
- Create movie → create showtime → create booking
- Verify data consistency across related entities

### 5. Business Logic
- Seat availability checking
- Booking cancellation rules
- Price calculation
- Schedule conflicts

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend is running on correct port
   - Check CORS configuration in app.js

2. **Authentication Errors**
   - Verify token format: `Bearer <token>`
   - Check token expiration
   - Ensure user has required role

3. **File System Errors**
   - Check database folder permissions
   - Verify JSON file format
   - Ensure write permissions

4. **Port Conflicts**
   - Check if port 5000 is available
   - Update BASE_URL in test script if needed

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
NODE_ENV=development npm start
```

## 📝 Test Checklist

- [ ] Authentication (register, login, token validation)
- [ ] Movies CRUD operations
- [ ] Studios CRUD operations
- [ ] Showtimes CRUD operations
- [ ] AddOns CRUD operations (admin)
- [ ] Promotions CRUD operations
- [ ] Ticket Prices CRUD operations (admin)
- [ ] Notifications CRUD operations
- [ ] Booking workflow
- [ ] Schedule management (admin)
- [ ] Data relationships
- [ ] Error handling
- [ ] Validation rules
- [ ] Business logic

## 🎯 Performance Testing

For load testing, you can use tools like:
- **Apache Bench (ab)**
- **Artillery**
- **k6**

Example with Apache Bench:
```bash
ab -n 100 -c 10 http://localhost:5000/api/movies
```

This guide should help you thoroughly test all API endpoints and ensure the system works correctly! 