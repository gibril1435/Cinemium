# Cinemium - Cinema Management System

A comprehensive cinema management system with customer booking interface and admin dashboard.

## 🏗️ Project Structure

```
Cinemium/
├── src/                    # Backend API (Node.js/Express)
├── customer-frontend/      # Customer booking interface (React/TypeScript)
├── admin-dashboard-new/    # Admin dashboard (React/TypeScript)
├── cinemium.sql           # Database schema and dummy data
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **SQL Server** (Express or Developer edition)
- **npm** or **yarn**

### 1. Database Setup

1. Install SQL Server if you haven't already
2. Open SQL Server Management Studio or Azure Data Studio
3. Run the `cinemium.sql` file to create the database and tables
4. Note down your database credentials

### 2. Backend Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your database credentials
# Update DB_USER, DB_PASS, and JWT_SECRET

# Start the server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Customer Frontend Setup

```bash
cd customer-frontend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Start the development server
npm start
```

The customer frontend will run on `http://localhost:3000`

### 4. Admin Dashboard Setup

```bash
cd admin-dashboard-new

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Start the development server
npm start
```

The admin dashboard will run on `http://localhost:3001`

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_NAME=Cinemium
DB_USER=your_username
DB_PASS=your_password
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
LOG_LEVEL=debug
BCRYPT_ROUNDS=10
```

### Frontend (.env)
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_ENV=development
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true
```

## 📊 Database Schema

The system includes the following main entities:
- **Users** - Customer and admin accounts
- **Movies** - Film information and metadata
- **Studios** - Cinema rooms with seating capacity
- **Showtimes** - Movie screening schedules
- **Seats** - Individual seat management
- **Bookings** - Customer reservations
- **AddOns** - Concessions and additional services

## 🔐 Authentication

- JWT-based authentication
- Role-based access control (Admin/User)
- Secure password hashing with bcrypt

## 🎯 Features

### Customer Features
- Browse movies and showtimes
- Select seats and make bookings
- Purchase add-ons (concessions)
- View booking history
- User registration and login

### Admin Features
- Movie management
- Studio and seat management
- Showtime scheduling
- Booking management
- Sales analytics
- User management
- Promotion management

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Movies
- `GET /api/movies` - Get all movies
- `GET /api/movies/:id` - Get movie details
- `POST /api/admin/movies` - Create movie (Admin)
- `PUT /api/admin/movies/:id` - Update movie (Admin)
- `DELETE /api/admin/movies/:id` - Delete movie (Admin)

### Bookings
- `GET /api/booking` - Get user bookings
- `POST /api/booking` - Create booking
- `PUT /api/booking/:id` - Update booking

### Admin Routes
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/analytics` - Get sales analytics
- `GET /api/admin/users` - Get all users

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify SQL Server is running
   - Check database credentials in `.env`
   - Ensure database `Cinemium` exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing processes using the port

3. **CORS Errors**
   - Verify CORS_ORIGIN in backend `.env`
   - Check frontend API_BASE_URL

4. **JWT Errors**
   - Ensure JWT_SECRET is set in backend `.env`
   - Check token expiration

### Development Commands

```bash
# Backend
npm run dev          # Start with nodemon
npm start           # Start production

# Frontend
npm start           # Start development server
npm run build       # Build for production
npm test            # Run tests
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team. 