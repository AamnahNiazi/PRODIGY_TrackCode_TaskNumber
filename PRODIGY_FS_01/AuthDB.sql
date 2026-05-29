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

-- Insert test admin (password: admin123, hash from bcrypt)
-- Will be created via code or manually.
