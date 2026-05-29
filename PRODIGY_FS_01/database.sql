CREATE DATABASE AuthDB;
GO
USE AuthDB;
GO
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) UNIQUE NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) DEFAULT 'user'
);
GO
-- Optional: Insert a test admin (password will be hashed by app)
-- INSERT INTO Users (username, email, password_hash, role) VALUES ('admin', 'admin@example.com', '$2b$10$...', 'admin');