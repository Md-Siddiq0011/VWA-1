-- ============================================================
-- schema.sql - VWA-2 learning database schema
-- ============================================================
-- The server creates these tables automatically on startup.
-- Keep this file for learning, local practice, and reference.
-- ============================================================

CREATE DATABASE IF NOT EXISTS voteapp;
USE voteapp;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    has_voted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    party VARCHAR(150) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    votes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS election (
    id INT PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'closed'
);

INSERT IGNORE INTO election (id, status) VALUES (1, 'closed');

INSERT INTO candidates (name, party, description, image)
SELECT * FROM (
    SELECT
      'Vijay',
      'TVK (Tamilaga Vettri Kazhagam)',
      'Tamilaga Vettri Kazhagam candidate for the TN 2031 Legislative Assembly election.',
      '/assets/images/vijay.jpg'
    UNION ALL SELECT
      'M. K. Stalin',
      'DMK (Dravida Munnetra Kazhagam)',
      'Dravida Munnetra Kazhagam candidate for the TN 2031 Legislative Assembly election.',
      '/assets/images/stalin.jpg'
    UNION ALL SELECT
      'Edappadi K. Palaniswami',
      'ADMK (All India Anna Dravida Munnetra Kazhagam)',
      'All India Anna Dravida Munnetra Kazhagam candidate for the TN 2031 Legislative Assembly election.',
      '/assets/images/eps.jpg'
) AS default_candidates
WHERE NOT EXISTS (SELECT 1 FROM candidates);
