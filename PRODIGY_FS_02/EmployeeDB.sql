CREATE DATABASE EmployeeDB;
GO
USE EmployeeDB;
GO
CREATE TABLE Employees (
    id INT IDENTITY PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    position NVARCHAR(100),
    salary DECIMAL(10,2),
    hire_date DATE
);
-- Add Users table from Task1 or reuse same DB for simplicity.