CREATE DATABASE SocialDB;
GO
USE SocialDB;
GO
CREATE TABLE Users (id INT IDENTITY PRIMARY KEY, username NVARCHAR(50), password_hash NVARCHAR(255), profile_pic NVARCHAR(255));
CREATE TABLE Posts (id INT IDENTITY, user_id INT, content NVARCHAR(500), media_url NVARCHAR(255), created_at DATETIME DEFAULT GETDATE());
CREATE TABLE Likes (user_id INT, post_id INT, PRIMARY KEY (user_id, post_id));
CREATE TABLE Comments (id INT IDENTITY, user_id INT, post_id INT, comment NVARCHAR(200), created_at DATETIME);
CREATE TABLE Follows (follower_id INT, followee_id INT, PRIMARY KEY (follower_id, followee_id));