CREATE DATABASE EmployeeDB;
GO
USE EmployeeDB;
GO
CREATE TABLE Employees (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    position NVARCHAR(100),
    salary DECIMAL(10,2),
    hire_date DATE
);
-- Reuse Users table from AuthDB but for simplicity we add it here
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) UNIQUE NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) DEFAULT 'user'
);
-- Insert admin (password: admin123)
-- You can register via API or manually insert with bcrypt hash.