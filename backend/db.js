/* ============================================================
   db.js — MySQL Database Connection
   ============================================================

   Purpose:
   - Creates a reusable MySQL CONNECTION POOL.
   - Used by backend APIs to store and fetch voting data.

   Supports:
   ✅ Local MySQL development
   ✅ Docker MySQL container
   ✅ Cloud MySQL (Northflank) with SSL

   Why SSL?
   - Northflank MySQL requires secure encrypted connections.
   - Without SSL you get:
     "Connections using insecure transport are prohibited"

   ============================================================ */


// ---- Import mysql2 promise version ----
// Allows async / await database operations
const mysql = require("mysql2/promise");


// ---- Create MySQL connection pool ----
// Values come from environment variables
// Environment variables are safer than writing passwords in code
const pool = mysql.createPool({

  // Database host
  // Local: localhost
  // Docker: db
  // Cloud: Northflank HOST variable
  host: process.env.DB_HOST || "localhost",


  // Database port
  // MySQL default port is 3306
  port: process.env.DB_PORT || 3306,


  // Database username
  user: process.env.DB_USER || "root",


  // Database password
  password: process.env.DB_PASSWORD || "password",


  // Database name
  database: process.env.DB_NAME || "voteapp",


  /* ------------------------------------------------------------
     SSL Configuration (Important for Cloud Deployment)

     Northflank MySQL:
     - require_secure_transport = ON
     - SSL connection required

     rejectUnauthorized:false allows managed cloud certificates.
     ------------------------------------------------------------ */
  ssl: process.env.DB_HOST === "localhost"
    ? undefined
    : {
        rejectUnauthorized: false
      },


  // Keep connections available for reuse
  waitForConnections: true,


  // Maximum active database connections
  connectionLimit: 10,


  // Unlimited waiting queue
  queueLimit: 0,


  // Timeout after 60 seconds
  connectTimeout: 60000,

});



/* ============================================================
   Test database connection when backend starts
   ============================================================ */

async function testConnection() {

  try {

    // Request one connection from pool
    const connection = await pool.getConnection();


    console.log("=====================================");
    console.log("✅ MySQL Database Connected Successfully");
    console.log("🌐 Host:", process.env.DB_HOST || "localhost");
    console.log("🔒 SSL Enabled:", process.env.DB_HOST !== "localhost");
    console.log("=====================================");


    // Return connection back to pool
    connection.release();

  } catch (error) {

    console.error("=====================================");
    console.error("❌ Failed to connect to MySQL");
    console.error("Reason:", error.message);
    console.error("Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME");
    console.error("=====================================");

    // Do not stop server
    // Cloud databases sometimes need time before accepting connections
  }
}


// Run connection test
testConnection();



/* ============================================================
   Export database pool

   Usage example:
   const db = require("./db");

   await db.execute("SELECT * FROM votes");

   ============================================================ */

module.exports = pool;