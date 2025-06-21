# Cinemium - Cinema Management System

A comprehensive cinema management system with a customer-facing booking interface and a full-featured admin dashboard. This project is built with a Node.js/Express backend, and two separate React/TypeScript frontends for the customer and admin interfaces.

## Demo

[Cinemium Demo Video](https://www.youtube.com/watch?v=oGGMkw8ANyc)

## Academic Report

[View the Academic Report (Google Docs)]((https://docs.google.com/document/d/1duKe4aXast7hD65MvSeZIIxzBR-HDKAAjZoW0FYkLBc/edit?usp=sharing))

## 🏗️ Project Structure

The project is organized into the following main directories:

```
Cinemium/
├── src/            # Backend API (Node.js/Express)
│   ├── controllers/
│   ├── middleware/
│   └── routes/
├── customer/       # Customer booking interface (React/TypeScript)
├── admin/          # Admin dashboard (React/TypeScript)
├── database/       # JSON-based database files
├── docs/           # Documentation files
└── README.md
```

## 🚀 Quick Start

To get the project up and running locally, follow these steps:

### Prerequisites

  * **Node.js** (v14 or higher)
  * **npm** or **yarn**

### 1\. Backend Setup

```bash
# Install dependencies from the root directory
npm install

# Start the server
npm run dev
```

The backend API will be available at `http://localhost:5000`.

### 2\. Customer Frontend Setup

```bash
# Navigate to the customer directory
cd customer

# Install dependencies
npm install

# Start the development server
npm start
```

The customer-facing application will be running at `http://localhost:3000`.

### 3\. Admin Dashboard Setup

```bash
# Navigate to the admin directory
cd admin

# Install dependencies
npm install

# Start the development server
npm start
```

The admin dashboard will be running at `http://localhost:4000`.

## 📊 Database Schema

The application uses a JSON-based database, with the following main data models:

  * **Users**: Stores customer and admin account information.
  * **Movies**: Contains film details, including metadata like genre, director, and cast.
  * **Studios**: Defines the cinema rooms and their seating capacity.
  * **Showtimes**: Manages the screening schedules for movies.
  * **Seats**: Handles individual seat management within each studio.
  * **Bookings**: Stores customer reservations and transaction details.
  * **AddOns**: Manages concession items and other additional services.
  * **Promotions**: Contains details about active promotional offers.

## 🔐 Authentication

The Cinemium application uses a robust JWT-based authentication system with the following features:

  * **Token-Based Security**: Secure authentication using JSON Web Tokens (JWT).
  * **Role-Based Access Control**: Differentiates between 'Admin' and 'User' roles, ensuring proper access levels.
  * **Secure Password Storage**: Passwords are not stored in plaintext; they are securely hashed using bcrypt.
  * **Protected Routes**: Middleware is used to protect sensitive routes, ensuring only authenticated and authorized users can access them.

## 🎯 Features

### Customer-Facing Application

  * **Movie Browse**: Browse a list of currently showing movies with details like posters, titles, genres, and prices.
  * **Dynamic Search**: Easily search for movies by title or genre.
  * **Detailed Movie Information**: View comprehensive details for each movie, including synopsis, cast, director, and production house.
  * **Showtime Selection**: See all available showtimes for a selected movie.
  * **Visual Seat Selection**: An interactive 8x5 grid allows users to visually select up to 4 seats.
  * **Add-On Purchases**: Option to purchase add-ons like popcorn and soda along with movie tickets.
  * **User Authentication**: Secure user registration and login functionality.
  * **Booking History**: View a comprehensive history of all past ticket purchases, grouped by date.
  * **Digital Tickets**: Access and view digital tickets with QR codes after a successful booking.

### Admin Dashboard

  * **Sales Dashboard**: A comprehensive dashboard to monitor daily sales with statistics on tickets sold and revenue, along with charts for film distribution and sales trends.
  * **Detailed Sales Analytics**: In-depth analysis of sales data with filtering options.
  * **Cinema Management**: A centralized hub to manage all operational aspects of the cinema.
  * **Movie Management**: Full CRUD (Create, Read, Update, Delete) functionality for movies.
  * **Showtime Scheduling**: Easily create, update, and manage movie showtimes.
  * **Studio and Seat Management**: Manage studio details and seat configurations.
  * **Add-On Management**: Full CRUD functionality for add-on items like food and beverages.
  * **Pricing Configuration**: Set default and custom ticket prices for different days or events.
  * **Promotion Management**: Create and manage promotional offers for customers.

## 🔐 Backend Roles & Permissions

The backend employs a straightforward and effective role-based access control (RBAC) system to secure endpoints and differentiate user capabilities. This is primarily managed through JWT authentication and custom middleware that checks user roles.

The two main roles in the system are:

### **1. Customer**
This is the default role for any new user who registers on the platform. Their permissions are scoped to the customer-facing application.

* **Authentication**: Can register, log in, and log out.
* **Movie & Showtime Information**: Can browse and view details for all currently showing movies and their showtimes.
* **Booking**: Can view seat layouts for showtimes, create new bookings for themselves, and purchase add-ons.
* **Booking History**: Can access their personal booking history and view their digital tickets.

### **2. Admin**
This is a privileged role assigned manually within the database. Admins have full control over the cinema's data and operations via the admin dashboard.

* **Secure Access**: All admin-level API routes are protected by an `isAdmin` middleware, which verifies that the user has the `admin` role before allowing access. Unauthorized users attempting to access these routes will receive a `403 Forbidden` error.
* **Comprehensive Management**: Admins have full CRUD (Create, Read, Update, Delete) capabilities over all major data models, including:
    * Movies
    * Showtimes
    * Studios & Seats
    * Promotions
    * Add-Ons (concessions)
* **Business Analytics**: Can access the main dashboard to view sales figures, top-performing movies, and other key metrics.
* **Sales Data**: Can view detailed transaction reports and filter them by various criteria.
