CREATE DATABASE EcommerceDB;
GO
USE EcommerceDB;
GO
CREATE TABLE Products (
    id INT IDENTITY PRIMARY KEY,
    name NVARCHAR(100),
    description NVARCHAR(500),
    price DECIMAL(10,2),
    image_url NVARCHAR(255),
    category NVARCHAR(50)
);
-- Insert sample products
INSERT INTO Products VALUES ('Laptop', 'High performance', 999.99, '/images/laptop.jpg', 'Electronics');