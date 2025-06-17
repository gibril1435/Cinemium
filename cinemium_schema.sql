-- Cinemium Database Schema
-- Created for the Cinemium Movie Theater Management System

-- Enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- Create Users table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLoginAt DATETIME,
    CONSTRAINT UQ_Username UNIQUE (Username)
);

-- Create Movies table
CREATE TABLE Movies (
    MovieID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(100) NOT NULL,
    Synopsis NVARCHAR(MAX),
    Genre NVARCHAR(50),
    Director NVARCHAR(100),
    ProductionHouse NVARCHAR(100),
    PosterURL NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME
);

-- Create Actors table
CREATE TABLE Actors (
    ActorID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL
);

-- Create MovieActors junction table
CREATE TABLE MovieActors (
    MovieID INT,
    ActorID INT,
    PRIMARY KEY (MovieID, ActorID),
    FOREIGN KEY (MovieID) REFERENCES Movies(MovieID) ON DELETE CASCADE,
    FOREIGN KEY (ActorID) REFERENCES Actors(ActorID) ON DELETE CASCADE
);

-- Create Studios table
CREATE TABLE Studios (
    StudioID INT IDENTITY(1,1) PRIMARY KEY,
    StudioNumber INT NOT NULL,
    TotalSeats INT NOT NULL DEFAULT 40, -- 8x5 layout
    CONSTRAINT UQ_StudioNumber UNIQUE (StudioNumber)
);

-- Create Showtimes table
CREATE TABLE Showtimes (
    ShowtimeID INT IDENTITY(1,1) PRIMARY KEY,
    MovieID INT NOT NULL,
    StudioID INT NOT NULL,
    ShowDateTime DATETIME NOT NULL,
    FOREIGN KEY (MovieID) REFERENCES Movies(MovieID) ON DELETE CASCADE,
    FOREIGN KEY (StudioID) REFERENCES Studios(StudioID),
    CONSTRAINT UQ_ShowtimeStudio UNIQUE (StudioID, ShowDateTime)
);

-- Create TicketPrices table
CREATE TABLE TicketPrices (
    PriceID INT IDENTITY(1,1) PRIMARY KEY,
    IsDefault BIT NOT NULL DEFAULT 1,
    Price DECIMAL(10,2) NOT NULL,
    StartDate DATE,
    EndDate DATE,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Price CHECK (Price > 0)
);

-- Create AddOns table
CREATE TABLE AddOns (
    AddOnID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255),
    Price DECIMAL(10,2) NOT NULL,
    IsActive BIT DEFAULT 1,
    CONSTRAINT CHK_AddOnPrice CHECK (Price > 0)
);

-- Create Transactions table
CREATE TABLE Transactions (
    TransactionID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ShowtimeID INT NOT NULL,
    TransactionDate DATETIME DEFAULT GETDATE(),
    TotalAmount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ShowtimeID) REFERENCES Showtimes(ShowtimeID)
);

-- Create Tickets table
CREATE TABLE Tickets (
    TicketID INT IDENTITY(1,1) PRIMARY KEY,
    TransactionID INT NOT NULL,
    SeatNumber NVARCHAR(3) NOT NULL, -- Format: A1, B2, etc.
    QRCode NVARCHAR(255) NOT NULL,
    FOREIGN KEY (TransactionID) REFERENCES Transactions(TransactionID) ON DELETE CASCADE
);

-- Create TransactionAddOns junction table
CREATE TABLE TransactionAddOns (
    TransactionID INT,
    AddOnID INT,
    Quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (TransactionID, AddOnID),
    FOREIGN KEY (TransactionID) REFERENCES Transactions(TransactionID) ON DELETE CASCADE,
    FOREIGN KEY (AddOnID) REFERENCES AddOns(AddOnID),
    CONSTRAINT CHK_Quantity CHECK (Quantity > 0)
);

-- Create indexes for better performance
CREATE INDEX IDX_Users_Username ON Users(Username);
CREATE INDEX IDX_Movies_Title ON Movies(Title);
CREATE INDEX IDX_Showtimes_DateTime ON Showtimes(ShowDateTime);
CREATE INDEX IDX_Transactions_UserID ON Transactions(UserID);
CREATE INDEX IDX_Transactions_Date ON Transactions(TransactionDate);
CREATE INDEX IDX_Tickets_TransactionID ON Tickets(TransactionID);

-- Create view for sales reporting
CREATE VIEW SalesReport AS
SELECT 
    t.TransactionID,
    u.Username,
    m.Title AS MovieTitle,
    s.ShowDateTime,
    t.TransactionDate,
    t.TotalAmount,
    STRING_AGG(CONCAT(ta.Quantity, 'x ', a.Name), ', ') AS AddOns
FROM Transactions t
JOIN Users u ON t.UserID = u.UserID
JOIN Showtimes s ON t.ShowtimeID = s.ShowtimeID
JOIN Movies m ON s.MovieID = m.MovieID
LEFT JOIN TransactionAddOns ta ON t.TransactionID = ta.TransactionID
LEFT JOIN AddOns a ON ta.AddOnID = a.AddOnID
GROUP BY t.TransactionID, u.Username, m.Title, s.ShowDateTime, t.TransactionDate, t.TotalAmount;

-- Create view for user purchase history
CREATE VIEW UserPurchaseHistory AS
SELECT 
    u.UserID,
    u.Username,
    t.TransactionID,
    m.Title AS MovieTitle,
    s.ShowDateTime,
    t.TransactionDate,
    STRING_AGG(tk.SeatNumber, ', ') AS Seats,
    t.TotalAmount,
    STRING_AGG(CONCAT(ta.Quantity, 'x ', a.Name), ', ') AS AddOns
FROM Users u
JOIN Transactions t ON u.UserID = t.UserID
JOIN Showtimes s ON t.ShowtimeID = s.ShowtimeID
JOIN Movies m ON s.MovieID = m.MovieID
JOIN Tickets tk ON t.TransactionID = tk.TransactionID
LEFT JOIN TransactionAddOns ta ON t.TransactionID = ta.TransactionID
LEFT JOIN AddOns a ON ta.AddOnID = a.AddOnID
GROUP BY u.UserID, u.Username, t.TransactionID, m.Title, s.ShowDateTime, t.TransactionDate, t.TotalAmount; 