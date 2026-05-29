CREATE DATABASE EcommerceDB;
GO
USE EcommerceDB;
GO
CREATE TABLE Products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    image_url NVARCHAR(255),
    category NVARCHAR(50)
);
-- Sample products
INSERT INTO Products (name, description, price, image_url, category) VALUES
('Laptop', 'High performance laptop', 999.99, 'https://via.placeholder.com/150?text=Laptop', 'Electronics'),
('T-Shirt', 'Cotton T-Shirt', 19.99, 'https://via.placeholder.com/150?text=TShirt', 'Clothing'),
('Coffee Mug', 'Ceramic mug', 9.99, 'https://via.placeholder.com/150?text=Mug', 'Home');