/* ============================================================
   db.js - MySQL connection and automatic database setup
   ============================================================
   This file keeps database code in one simple place.
   When the server starts, initDatabase() creates the required
   tables if they are missing.
   ============================================================ */

const mysql = require("mysql2/promise");

const DB_NAME = process.env.DB_NAME || "voteapp";

const commonConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  ssl:
    process.env.DB_HOST && process.env.DB_HOST !== "localhost"
      ? { rejectUnauthorized: false }
      : undefined,
};

// This pool is created after the database is ready.
let pool;

function getPool() {
  if (!pool) {
    throw new Error("Database is not ready yet");
  }
  return pool;
}

async function initDatabase() {
  try {
    // First try to create DB_NAME for local MySQL.
    // Some cloud MySQL users cannot create databases, so permission
    // errors are allowed and we continue with the provided DB_NAME.
    try {
      const setupConnection = await mysql.createConnection(commonConfig);
      await setupConnection.query("CREATE DATABASE IF NOT EXISTS `" + DB_NAME + "`");
      await setupConnection.end();
    } catch (setupError) {
      console.log("Skipping database creation:", setupError.message);
    }

    pool = mysql.createPool({
      ...commonConfig,
      database: DB_NAME,
    });

    // users table stores registered voters.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        has_voted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // candidates table stores dynamic candidate details and vote count.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        party VARCHAR(150) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        votes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // election table stores whether voting is open or closed.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS election (
        id INT PRIMARY KEY,
        status VARCHAR(20) NOT NULL DEFAULT 'closed'
      )
    `);

    await pool.query(
      "INSERT IGNORE INTO election (id, status) VALUES (1, 'closed')"
    );

    // Add default candidates only when the table is empty.
    const [candidateCount] = await pool.query(
      "SELECT COUNT(*) AS total FROM candidates"
    );

    if (candidateCount[0].total === 0) {
      await pool.query(
        `INSERT INTO candidates (name, party, description, image) VALUES
          (?, ?, ?, ?),
          (?, ?, ?, ?),
          (?, ?, ?, ?)`,
        [
          "Vijay",
          "TVK (Tamilaga Vettri Kazhagam)",
          "Tamilaga Vettri Kazhagam candidate for the TN 2031 Legislative Assembly election.",
          "/assets/images/vijay.jpg",
          "M. K. Stalin",
          "DMK (Dravida Munnetra Kazhagam)",
          "Dravida Munnetra Kazhagam candidate for the TN 2031 Legislative Assembly election.",
          "/assets/images/stalin.jpg",
          "Edappadi K. Palaniswami",
          "ADMK (All India Anna Dravida Munnetra Kazhagam)",
          "All India Anna Dravida Munnetra Kazhagam candidate for the TN 2031 Legislative Assembly election.",
          "/assets/images/eps.jpg",
        ]
      );
    }

    console.log("MySQL connected and required tables are ready.");
  } catch (error) {
    console.error("Database disconnected:", error.message);
    throw error;
  }
}

module.exports = {
  initDatabase,
  getPool,
};
