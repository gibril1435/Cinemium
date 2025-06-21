# Cinemium API Documentation

## Authentication Endpoints

### Register New User
- **Method:** POST
- **Path:** `/api/auth/register`
- **Description:** Creates a new user account
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response:** 201 Created
  ```json
  {
    "message": "Account created successfully",
    "redirect": "/login"
  }
  ```

### User Login
- **Method:** POST
- **Path:** `/api/auth/login`
- **Description:** Authenticates user and handles redirection based on login source
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string",
    "source": "home|movie|seat"
  }
  ```
- **Response:** 200 OK
  ```json
  {
    "token": "string",
    "redirect": "/home|/movie/:id|/seat/:showtimeId"
  }
  ```

### Get Current User
- **Method:** GET
- **Path:** `/api/auth/me`
- **Description:** Returns the current user from the token
- **Response:** 200 OK
  ```json
  {
    "id": "number",
    "username": "string",
    "role": "customer|admin"
  }
  ```

### Logout
- **Method:** POST
- **Path:** `/api/auth/logout`
- **Description:** Securely terminates the session
- **Response:** 200 OK
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

## Customer Endpoints

### Movies
- `GET /api/movies/now-showing` - Get currently showing movies
- `GET /api/movies/:id` - Get movie details

### Promotions
- `GET /api/promotions` - Get all active promotions
- `GET /api/promotions/:id` - Get promotion details

### Add-ons
- `GET /api/addons` - Get all available add-ons
- `GET /api/addons/:id` - Get add-on details

### Booking (Unified Transaction Endpoints)
- `POST /api/booking/transactions` - Create a new booking (purchase tickets)
- `GET /api/booking/:id` - Get booking details
- `GET /api/booking/:id/ticket-pdf` - Get PDF ticket
- `GET /api/booking/history` - Get user's booking history (includes studio number)

### Seat Layout
- `GET /api/showtimes/:showtimeId/seats` - Get seat layout for a showtime

---

## Admin Endpoints

### Dashboard & Analytics
- `GET /api/admin/dashboard` - Get dashboard summary
  - Response: 
    ```json
    {
      "todayStats": {
        "totalTickets": "number",
        "totalRevenue": "number"
      },
      "topMovies": [
        {
          "id": "number",
          "title": "string",
          "ticketsSold": "number",
          "revenue": "number"
        }
      ],
      "topAddons": [
        {
          "id": "number",
          "name": "string",
          "quantitySold": "number",
          "revenue": "number"
        }
      ]
    }
    ```
- `GET /api/admin/sales` - Get sales data
  - Query Parameters:
    - `startDate`: Start date (YYYY-MM-DD)
    - `endDate`: End date (YYYY-MM-DD)
    - `movieId`: Filter by movie
    - `studioId`: Filter by studio
  - Response:
    ```json
    {
      "totalRevenue": "number",
      "ticketSales": "number",
      "addOnSales": "number",
      "transactions": [
        {
          "id": "number",
          "movieTitle": "string",
          "showtime": "string",
          "studio": "number",
          "seats": ["string"],
          "addOns": [
            {
              "name": "string",
              "quantity": "number",
              "price": "number"
            }
          ],
          "totalAmount": "number",
          "transactionDate": "string"
        }
      ]
    }
    ```

### Movies Management
- `GET /api/admin/movies` - Get all movies
  - Response:
    ```json
    [
      {
        "id": "number",
        "title": "string",
        "description": "string",
        "duration": "number",
        "releaseDate": "string",
        "genre": "string",
        "director": "string",
        "cast": ["string"],
        "posterUrl": "string",
        "status": "active|inactive"
      }
    ]
    ```
- `POST /api/admin/movies` - Create new movie
  - Request Body:
    ```json
    {
      "title": "string",
      "description": "string",
      "duration": "number",
      "releaseDate": "string",
      "genre": "string",
      "director": "string",
      "cast": ["string"],
      "posterUrl": "string"
    }
    ```
- `PUT /api/admin/movies/:id` - Update movie
  - Request Body: Same as Create
- `DELETE /api/admin/movies/:id` - Delete movie

### Showtimes Management
- `GET /api/admin/showtimes` - Get all showtimes
  - Response:
    ```json
    [
      {
        "id": "number",
        "movieId": "number",
        "studioId": "number",
        "startTime": "string",
        "endTime": "string",
        "date": "string",
        "price": "number",
        "status": "scheduled|cancelled|completed"
      }
    ]
    ```
- `POST /api/admin/showtimes` - Create new showtime
  - Request Body:
    ```json
    {
      "movieId": "number",
      "studioId": "number",
      "startTime": "string",
      "date": "string",
      "price": "number"
    }
    ```
- `PUT /api/admin/showtimes/:id` - Update showtime
  - Request Body: Same as Create
- `DELETE /api/admin/showtimes/:id` - Delete showtime

### Studios Management
- `GET /api/admin/studios` - Get all studios
  - Response:
    ```json
    [
      {
        "id": "number",
        "name": "string",
        "capacity": "number",
        "layout": {
          "rows": "number",
          "columns": "number",
          "seats": [
            {
              "id": "string",
              "row": "number",
              "column": "number",
              "status": "available|reserved|maintenance"
            }
          ]
        },
        "status": "active|maintenance|inactive"
      }
    ]
    ```
- `POST /api/admin/studios` - Create new studio
  - Request Body:
    ```json
    {
      "name": "string",
      "capacity": "number",
      "rows": "number",
      "columns": "number",
      "status": "active|maintenance|inactive"
    }
    ```
- `PUT /api/admin/studios/:id` - Update studio
  - Request Body: Same as Create
- `DELETE /api/admin/studios/:id` - Delete studio

### Add-ons Management
- `GET /api/admin/addons` - Get all add-ons
  - Response:
    ```json
    [
      {
        "id": "number",
        "name": "string",
        "description": "string",
        "price": "number",
        "stock": "number",
        "imageUrl": "string",
        "category": "string",
        "status": "active|inactive"
      }
    ]
    ```
- `POST /api/admin/addons` - Create new add-on
  - Request Body:
    ```json
    {
      "name": "string",
      "description": "string",
      "price": "number",
      "stock": "number",
      "imageUrl": "string",
      "category": "string",
      "status": "active|inactive"
    }
    ```
- `PUT /api/admin/addons/:id` - Update add-on
  - Request Body: Same as Create
- `DELETE /api/admin/addons/:id` - Delete add-on

### Pricing Management
- `GET /api/admin/prices` - Get all ticket price rules
  - Response:
    ```json
    [
      {
        "id": "number",
        "isDefault": "boolean",
        "price": "number",
        "startDate": "string",
        "endDate": "string"
      }
    ]
    ```
- `POST /api/admin/prices` - Create new ticket price rule
  - Request Body:
    ```json
    {
      "isDefault": "boolean",
      "price": "number",
      "startDate": "string",
      "endDate": "string"
    }
    ```
- `PUT /api/admin/prices/:id` - Update ticket price rule
  - Request Body: Same as Create
- `DELETE /api/admin/prices/:id` - Delete ticket price rule

### Promotions Management
- `GET /api/admin/promotions` - Get all promotions
  - Response:
    ```json
    [
      {
        "id": "number",
        "title": "string",
        "description": "string",
        "discountPercentage": "number",
        "startDate": "string",
        "endDate": "string",
        "posterUrl": "string",
        "status": "active|inactive"
      }
    ]
    ```
- `POST /api/admin/promotions` - Create new promotion
  - Request Body:
    ```json
    {
      "title": "string",
      "description": "string",
      "discountPercentage": "number",
      "startDate": "string",
      "endDate": "string",
      "posterUrl": "string"
    }
    ```
- `PUT /api/admin/promotions/:id` - Update promotion
  - Request Body: Same as Create
- `DELETE /api/admin/promotions/:id` - Delete promotion

### Bookings Management
- `GET /api/admin/bookings` - Get all bookings
- `PUT /api/admin/bookings/:id/cancel` - Cancel a booking

### Notifications
- `GET /api/admin/notifications` - Get all notifications
- `POST /api/admin/notifications` - Create new notification
- `PUT /api/admin/notifications/:id/read` - Mark notification as read
- `DELETE /api/admin/notifications/:id` - Delete notification

---

## Error Responses

All endpoints may return the following error responses:

- **400 Bad Request**
  ```json
  {
    "error": "string",
    "message": "string"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Unauthorized",
    "message": "Authentication required"
  }
  ```

- **403 Forbidden**
  ```json
  {
    "error": "Forbidden",
    "message": "Insufficient permissions"
  }
  ```

- **404 Not Found**
  ```json
  {
    "error": "Not Found",
    "message": "Resource not found"
  }
  ```

- **500 Internal Server Error**
  ```json
  {
    "error": "Internal Server Error",
    "message": "An unexpected error occurred"
  }
  ``` 