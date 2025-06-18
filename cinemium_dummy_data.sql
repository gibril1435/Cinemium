-- Dummy data for Cinemium SQL Server database
USE Cinemium;
GO

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