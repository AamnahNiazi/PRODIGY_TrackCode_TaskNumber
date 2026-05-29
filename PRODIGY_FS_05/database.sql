CREATE DATABASE SocialDB;
GO
USE SocialDB;
GO
CREATE TABLE Users (
    id INT IDENTITY PRIMARY KEY,
    username NVARCHAR(50) UNIQUE NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    profile_pic NVARCHAR(255),
    bio NVARCHAR(200)
);
CREATE TABLE Posts (
    id INT IDENTITY PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE,
    content NVARCHAR(500),
    media_url NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE()
);
CREATE TABLE Likes (
    user_id INT,
    post_id INT,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (post_id) REFERENCES Posts(id) ON DELETE CASCADE
);
CREATE TABLE Comments (
    id INT IDENTITY PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES Users(id),
    post_id INT FOREIGN KEY REFERENCES Posts(id) ON DELETE CASCADE,
    comment NVARCHAR(200),
    created_at DATETIME DEFAULT GETDATE()
);
CREATE TABLE Follows (
    follower_id INT,
    followee_id INT,
    PRIMARY KEY (follower_id, followee_id),
    FOREIGN KEY (follower_id) REFERENCES Users(id),
    FOREIGN KEY (followee_id) REFERENCES Users(id)
);