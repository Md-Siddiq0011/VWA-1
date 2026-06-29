/* ============================================================
   db.js — MySQL Database Connection
   ============================================================
   This file creates a CONNECTION POOL to our MySQL database.
   
   What is a connection pool?
   - Instead of opening a new connection for every request,
     a pool keeps several connections ready to reuse.
   - This is much faster and more efficient.
   
   We export the pool so other files (like server.js) can use it.
   ============================================================ */

// ---- Import the mysql2 library ----
// We use mysql2/promise so we can use async/await syntax
// (instead of old-style callbacks)
const mysql = require("mysql2/promise");

// ---- Create the connection pool ----
// All connection details come from environment variables (.env file)
// This keeps passwords out of our code (security best practice)
const pool = mysql.createPool({
  // The hostname where MySQL is running
  // "db" is the Docker service name, "localhost" for local development
  host: process.env.DB_HOST || "localhost",

  // MySQL port (default is 3306)
  port: process.env.DB_PORT || 3306,

  // MySQL username
  user: process.env.DB_USER || "root",

  // MySQL password
  password: process.env.DB_PASSWORD || "password",

  // The database name to connect to
  database: process.env.DB_NAME || "voteapp",

  // Maximum number of connections in the pool
  // 10 is a good default for small applications
  waitForConnections: true,
  connectionLimit: 10,

  // How long to wait for a connection (in milliseconds)
  // 60 seconds should be more than enough
  queueLimit: 0,
  connectTimeout: 60000,
});

// ---- Test the connection on startup ----
// This immediately tells us if the database is reachable
async function testConnection() {
  try {
    // Try to get a connection from the pool
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL database successfully!");
    // Release the connection back to the pool
    connection.release();
  } catch (error) {
    console.error("❌ Failed to connect to MySQL:", error.message);
    console.error(
      "   Make sure MySQL is running and your .env settings are correct."
    );
    // Don't exit — the app might reconnect later when MySQL is ready
  }
}

// Run the connection test
testConnection();

// ---- Export the pool ----
// Other files can now use: const pool = require('./db');
module.exports = pool;
