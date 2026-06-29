-- ============================================================
-- schema.sql — Database Schema
-- ============================================================
-- This file creates the database and the votes table.
-- It runs automatically when the MySQL Docker container starts.
--
-- What this does:
-- 1. Creates a database called "voteapp" (if it doesn't exist)
-- 2. Switches to that database
-- 3. Creates a "votes" table to store each individual vote
-- ============================================================

-- Step 1: Create the database
-- IF NOT EXISTS prevents errors if the database already exists
CREATE DATABASE IF NOT EXISTS voteapp;

-- Step 2: Switch to the voteapp database
-- All following commands will apply to this database
USE voteapp;

-- Step 3: Create the votes table
-- Each row in this table represents ONE vote
CREATE TABLE IF NOT EXISTS votes (
    -- id: A unique number for each vote (auto-increments: 1, 2, 3, ...)
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- candidate: The name of the candidate who received this vote
    -- VARCHAR(100) means a text field up to 100 characters long
    -- NOT NULL means this field cannot be empty
    candidate VARCHAR(100) NOT NULL,

    -- voted_at: When this vote was cast
    -- CURRENT_TIMESTAMP automatically records the current date/time
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- That's it! The database is ready.
-- The "votes" table will store entries like:
--
-- | id | candidate     | voted_at            |
-- |----|---------------|---------------------|
-- | 1  | Candidate A   | 2026-06-29 10:15:00 |
-- | 2  | Candidate B   | 2026-06-29 10:15:05 |
-- | 3  | Candidate A   | 2026-06-29 10:15:10 |
-- ============================================================
