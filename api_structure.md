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
    "source": "home|movie|seat" // Where the login was initiated
  }
  ```
- **Response:** 200 OK
  ```json
  {
    "token": "string",
    "redirect": "/home|/movie/:id|/seat/:showtimeId"
  }
  ```

## Customer Movie Browse Endpoints

### Get Currently Showing Movies
- **Method:** GET
- **Path:** `/api/movies/now-showing`
- **Description:** Retrieves list of currently showing movies for home page
- **Query Parameters:**
  - `search`: Optional search term for movie title
- **Response:** 200 OK
  ```json
  {
    "movies": [
      {
        "id": "number",
        "title": "string",
        "genre": "string",
        "posterUrl": "string",
        "showtimes": [
          {
            "time": "string",
            "price": "number"
          }
        ]
      }
    ]
  }
  ```

### Get Movie Details
- **Method:** GET
- **Path:** `/api/movies/:id`
- **Description:** Retrieves detailed information about a specific movie
- **Response:** 200 OK
  ```json
  {
    "id": "number",
    "title": "string",
    "synopsis": "string",
    "genre": "string",
    "director": "string",
    "productionHouse": "string",
    "posterUrl": "string",
    "actors": ["string"],
    "showtimes": [
      {
        "id": "number",
        "time": "string",
        "studio": "number",
        "price": "number"
      }
    ]
  }
  ```

## Customer Booking Flow Endpoints

### Get Seat Layout
- **Method:** GET
- **Path:** `/api/showtimes/:showtimeId/seats`
- **Description:** Retrieves the 8x5 seat layout for a specific showtime
- **Response:** 200 OK
  ```json
  {
    "showtimeId": "number",
    "movieTitle": "string",
    "showTime": "string",
    "layout": {
      "rows": ["A", "B", "C", "D", "E"],
      "columns": [1, 2, 3, 4, 5, 6, 7, 8],
      "seats": [
        {
          "id": "string", // e.g., "A1"
          "status": "available|reserved|selected"
        }
      ]
    }
  }
  ```

### Process Payment
- **Method:** POST
- **Path:** `/api/transactions`
- **Description:** Processes ticket purchase and generates QR codes
- **Request Body:**
  ```json
  {
    "showtimeId": "number",
    "seats": ["string"], // e.g., ["A1", "A2"]
    "addOns": [
      {
        "id": "number",
        "quantity": "number"
      }
    ]
  }
  ```
- **Response:** 201 Created
  ```json
  {
    "transactionId": "number",
    "tickets": [
      {
        "seatNumber": "string",
        "qrCode": "string"
      }
    ],
    "totalAmount": "number"
  }
  ```

### Get Purchase History
- **Method:** GET
- **Path:** `/api/users/history`
- **Description:** Retrieves user's purchase history grouped by date
- **Response:** 200 OK
  ```json
  {
    "history": [
      {
        "date": "string",
        "transactions": [
          {
            "id": "number",
            "movieTitle": "string",
            "showTime": "string",
            "seats": ["string"],
            "totalAmount": "number"
          }
        ]
      }
    ]
  }
  ```

## Admin Statistics Endpoints

### Get Dashboard Summary
- **Method:** GET
- **Path:** `/api/admin/dashboard`
- **Description:** Retrieves summary data for admin dashboard
- **Response:** 200 OK
  ```json
  {
    "todayStats": {
      "totalTickets": "number",
      "totalRevenue": "number"
    },
    "filmDistribution": [
      {
        "movieTitle": "string",
        "ticketsSold": "number",
        "percentage": "number"
      }
    ],
    "salesTrend": [
      {
        "date": "string",
        "ticketsSold": "number",
        "revenue": "number"
      }
    ]
  }
  ```

## Admin Sales Database Endpoints

### Get Weekly Sales History
- **Method:** GET
- **Path:** `/api/admin/sales/weeks`
- **Description:** Retrieves sales history grouped by week
- **Response:** 200 OK
  ```json
  {
    "weeks": [
      {
        "weekStart": "string",
        "weekEnd": "string",
        "totalSales": "number",
        "totalTickets": "number"
      }
    ]
  }
  ```

### Get Weekly Sales Details
- **Method:** GET
- **Path:** `/api/admin/sales/weeks/:weekId`
- **Description:** Retrieves detailed, filterable sales data for a specific week
- **Query Parameters:**
  - `movie`: Filter by movie
  - `addOn`: Filter by add-on
  - `showtime`: Filter by showtime
  - `user`: Filter by username
  - `date`: Filter by date
- **Response:** 200 OK
  ```json
  {
    "weekStart": "string",
    "weekEnd": "string",
    "transactions": [
      {
        "id": "number",
        "username": "string",
        "movieTitle": "string",
        "showTime": "string",
        "seats": ["string"],
        "addOns": [
          {
            "name": "string",
            "quantity": "number"
          }
        ],
        "totalAmount": "number",
        "transactionDate": "string"
      }
    ]
  }
  ```

## Admin Cinema Management Endpoints

### Movie Management

#### Create Movie
- **Method:** POST
- **Path:** `/api/admin/movies`
- **Description:** Creates a new movie entry
- **Request Body:**
  ```json
  {
    "title": "string",
    "synopsis": "string",
    "genre": "string",
    "director": "string",
    "productionHouse": "string",
    "posterUrl": "string",
    "actors": ["string"]
  }
  ```
- **Response:** 201 Created

#### Update Movie
- **Method:** PUT
- **Path:** `/api/admin/movies/:id`
- **Description:** Updates an existing movie
- **Request Body:** Same as Create Movie
- **Response:** 200 OK

#### Delete Movie
- **Method:** DELETE
- **Path:** `/api/admin/movies/:id`
- **Description:** Deletes a movie and its associated showtimes
- **Response:** 200 OK

### Ticket Price Management

#### Set Ticket Price
- **Method:** POST
- **Path:** `/api/admin/prices`
- **Description:** Sets default or custom ticket prices
- **Request Body:**
  ```json
  {
    "isDefault": "boolean",
    "price": "number",
    "startDate": "string", // Required if isDefault is false
    "endDate": "string"    // Required if isDefault is false
  }
  ```
- **Response:** 201 Created

## Customer Endpoints

### Movies
- `GET /api/movies` - Get all movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/now-showing` - Get currently showing movies

### Promotions
- `GET /api/promotions` - Get all active promotions
- `GET /api/promotions/:id` - Get promotion details

### Transactions
- `POST /api/transactions` - Create a new transaction
  - Body: `{ showtimeId: string, seatIds: string[], addOns: { id: number, quantity: number }[] }`
  - Response: `{ id: string, ... }`
- `GET /api/transactions/:id` - Get transaction details
  - Response: `{ id: string, movieTitle: string, showtime: string, seats: string[], studio: string, addOns: { name: string, quantity: number, price: number }[], totalAmount: number }`
- `GET /api/transactions/:id/ticket-pdf` - Get PDF ticket
  - Response: PDF file

### Add-ons
- `GET /api/addons` - Get all available add-ons
- `GET /api/addons/:id` - Get add-on details

## Admin Endpoints

### Movies Management
- `GET /api/admin/movies` - Get all movies (admin view)
- `POST /api/admin/movies` - Create new movie
- `PUT /api/admin/movies/:id` - Update movie
- `DELETE /api/admin/movies/:id` - Delete movie

### Showtimes Management
- `GET /api/admin/showtimes` - Get all showtimes
- `POST /api/admin/showtimes` - Create new showtime
- `PUT /api/admin/showtimes/:id` - Update showtime
- `DELETE /api/admin/showtimes/:id` - Delete showtime

### Studios Management
- `GET /api/admin/studios` - Get all studios
- `POST /api/admin/studios` - Create new studio
- `PUT /api/admin/studios/:id` - Update studio
- `DELETE /api/admin/studios/:id` - Delete studio

### Sales & Analytics
- `GET /api/admin/sales` - Get sales data
  - Query params: `startDate`, `endDate`
  - Response: `{ totalRevenue: number, ticketSales: number, addOnSales: number, transactions: Transaction[] }`

### Notifications
- `GET /api/admin/notifications` - Get all notifications
- `POST /api/admin/notifications` - Create new notification
- `PUT /api/admin/notifications/:id/read` - Mark notification as read
- `DELETE /api/admin/notifications/:id` - Delete notification

### Promotions Management
- `GET /api/admin/promotions` - Get all promotions
- `POST /api/admin/promotions` - Create new promotion
- `PUT /api/admin/promotions/:id` - Update promotion
- `DELETE /api/admin/promotions/:id` - Delete promotion

## Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

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