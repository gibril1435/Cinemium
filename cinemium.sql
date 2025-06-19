-- Cinemium Full Database Setup (Schema + Dummy Data)
-- Created by uniting cinemium.sql and cinemium_dummy_data.sql

-- === SCHEMA SECTION ===
CREATE DATABASE Cinemium;
GO
USE Cinemium;
GO

-- Drop existing tables if they exist (in reverse order of dependencies)
IF OBJECT_ID('AddOnSales', 'U') IS NOT NULL DROP TABLE AddOnSales;
IF OBJECT_ID('BookingSeats', 'U') IS NOT NULL DROP TABLE BookingSeats;
IF OBJECT_ID('Bookings', 'U') IS NOT NULL DROP TABLE Bookings;
IF OBJECT_ID('Seats', 'U') IS NOT NULL DROP TABLE Seats;
IF OBJECT_ID('Showtimes', 'U') IS NOT NULL DROP TABLE Showtimes;
IF OBJECT_ID('Studios', 'U') IS NOT NULL DROP TABLE Studios;
IF OBJECT_ID('Movies', 'U') IS NOT NULL DROP TABLE Movies;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
IF OBJECT_ID('AddOns', 'U') IS NOT NULL DROP TABLE AddOns;

-- Create Users table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(256) NOT NULL,
    IsAdmin BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    LastLoginAt DATETIME NULL
);

-- Create Movies table
CREATE TABLE Movies (
    MovieID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(100) NOT NULL,
    Synopsis NVARCHAR(MAX) NOT NULL,
    Genre NVARCHAR(50) NOT NULL,
    Director NVARCHAR(100) NOT NULL,
    Actors NVARCHAR(MAX) NOT NULL,
    ProductionHouse NVARCHAR(100) NOT NULL,
    Duration INT NOT NULL, -- in minutes
    PosterURL NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create Studios table
CREATE TABLE Studios (
    StudioID INT IDENTITY(1,1) PRIMARY KEY,
    StudioNumber INT NOT NULL UNIQUE,
    Capacity INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Create Showtimes table
CREATE TABLE Showtimes (
    ShowtimeID INT IDENTITY(1,1) PRIMARY KEY,
    MovieID INT NOT NULL,
    StudioID INT NOT NULL,
    ShowDateTime DATETIME NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (MovieID) REFERENCES Movies(MovieID),
    FOREIGN KEY (StudioID) REFERENCES Studios(StudioID)
);

-- Create Seats table
CREATE TABLE Seats (
    SeatID INT IDENTITY(1,1) PRIMARY KEY,
    StudioID INT NOT NULL,
    SeatNumber NVARCHAR(10) NOT NULL,
    RowNumber NVARCHAR(5) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (StudioID) REFERENCES Studios(StudioID),
    CONSTRAINT UQ_SeatInStudio UNIQUE (StudioID, SeatNumber)
);

-- Create Bookings table
CREATE TABLE Bookings (
    BookingID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ShowtimeID INT NOT NULL,
    BookingDateTime DATETIME NOT NULL DEFAULT GETDATE(),
    TotalAmount DECIMAL(10,2) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Confirmed', -- Confirmed, Cancelled, Completed
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ShowtimeID) REFERENCES Showtimes(ShowtimeID)
);

-- Create BookingSeats table (junction table for seats in a booking)
CREATE TABLE BookingSeats (
    BookingSeatID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    SeatID INT NOT NULL,
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    FOREIGN KEY (SeatID) REFERENCES Seats(SeatID),
    CONSTRAINT UQ_SeatInBooking UNIQUE (BookingID, SeatID)
);

-- Create AddOns table
CREATE TABLE AddOns (
    AddOnID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL,
    Price DECIMAL(10,2) NOT NULL,
    Stock INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Create AddOnSales table (junction table for add-ons in a booking)
CREATE TABLE AddOnSales (
    AddOnSaleID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    AddOnID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    FOREIGN KEY (AddOnID) REFERENCES AddOns(AddOnID)
);

-- Create indexes for better performance
CREATE INDEX IX_Showtimes_MovieID ON Showtimes(MovieID);
CREATE INDEX IX_Showtimes_StudioID ON Showtimes(StudioID);
CREATE INDEX IX_Bookings_UserID ON Bookings(UserID);
CREATE INDEX IX_Bookings_ShowtimeID ON Bookings(ShowtimeID);
CREATE INDEX IX_BookingSeats_BookingID ON BookingSeats(BookingID);
CREATE INDEX IX_BookingSeats_SeatID ON BookingSeats(SeatID);
CREATE INDEX IX_AddOnSales_BookingID ON AddOnSales(BookingID);
CREATE INDEX IX_AddOnSales_AddOnID ON AddOnSales(AddOnID);

-- Add constraints for business rules
ALTER TABLE Bookings
ADD CONSTRAINT CHK_BookingStatus CHECK (Status IN ('Confirmed', 'Cancelled', 'Completed'));

ALTER TABLE AddOns
ADD CONSTRAINT CHK_AddOnPrice CHECK (Price >= 0);

ALTER TABLE Showtimes
ADD CONSTRAINT CHK_ShowtimePrice CHECK (Price >= 0);

ALTER TABLE Bookings
ADD CONSTRAINT CHK_BookingAmount CHECK (TotalAmount >= 0);

-- Add trigger to ensure maximum 4 seats per booking
CREATE TRIGGER TR_BookingSeats_MaxSeats
ON BookingSeats
AFTER INSERT
AS
BEGIN
    IF EXISTS (
        SELECT BookingID
        FROM BookingSeats
        GROUP BY BookingID
        HAVING COUNT(*) > 4
    )
    BEGIN
        RAISERROR ('Maximum 4 seats allowed per booking', 16, 1)
        ROLLBACK TRANSACTION
    END
END;

-- === DUMMY DATA SECTION ===
-- Users
INSERT INTO Users (Username, PasswordHash, IsAdmin)
VALUES
  ('admin', 'dummyhash1', 1),
  ('user1', 'dummyhash2', 0),
  ('user2', 'dummyhash3', 0);
GO

-- Movies
INSERT INTO Movies (Title, Synopsis, Genre, Director, Actors, ProductionHouse, Duration, PosterURL)
VALUES
  ('The Great Adventure', 'An epic journey.', 'Adventure', 'Jane Doe', 'John Smith, Alice Brown', 'Epic Studios', 120, 'https://example.com/poster1.jpg'),
  ('Space Odyssey', 'A trip through the stars.', 'Sci-Fi', 'Stan Kubrick', 'Dave Bowman, HAL 9000', 'Space Films', 140, 'https://example.com/poster2.jpg');
GO

-- Studios
INSERT INTO Studios (StudioNumber, Capacity)
VALUES
  (1, 40),
  (2, 40);
GO

-- Showtimes
INSERT INTO Showtimes (MovieID, StudioID, ShowDateTime, Price)
VALUES
  (1, 1, DATEADD(hour, 2, GETDATE()), 50000),
  (2, 2, DATEADD(hour, 4, GETDATE()), 60000);
GO

-- Seats for Studio 1
INSERT INTO Seats (StudioID, SeatNumber, RowNumber)
VALUES
  (1, 'A1', 'A'), (1, 'A2', 'A'), (1, 'B1', 'B'), (1, 'B2', 'B');
GO
-- Seats for Studio 2
INSERT INTO Seats (StudioID, SeatNumber, RowNumber)
VALUES
  (2, 'A1', 'A'), (2, 'A2', 'A'), (2, 'B1', 'B'), (2, 'B2', 'B');
GO

-- AddOns
INSERT INTO AddOns (Name, Description, Price, Stock)
VALUES
  ('Popcorn', 'Large popcorn', 20000, 100),
  ('Soda', 'Soft drink', 15000, 100);
GO 