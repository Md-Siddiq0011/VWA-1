/* ============================================================
   server.js — Main Express Server
   ============================================================
   This is the ENTRY POINT of our backend application.
   It does three things:
   1. Serves the frontend HTML/CSS/JS files
   2. Provides API endpoints for voting, results, and reset
   3. Connects to MySQL to store votes permanently
   ============================================================ */

// ---- Load environment variables from .env file ----
// dotenv reads the .env file and puts those values into process.env
require("dotenv").config();

// ---- Import required packages ----
// express: The web framework that handles HTTP requests
const express = require("express");

// path: Node.js built-in module for working with file paths
const path = require("path");

// cors: Allows our API to accept requests from different origins
const cors = require("cors");

// Import our database connection pool (defined in db.js)
const pool = require("./db");

// ---- Create the Express application ----
const app = express();

// ---- Read the port from environment variable, or default to 3000 ----
// Cloud platforms like Render/Railway set the PORT automatically
const PORT = process.env.PORT || 3000;

// ============================================================
// VOTING CONFIGURATION
// ============================================================
// How many seconds to wait before voting opens (countdown)
// Default: 10 seconds (change via VOTING_DELAY_SECONDS in .env)
const VOTING_DELAY_SECONDS = parseInt(process.env.VOTING_DELAY_SECONDS) || 10;

// How many seconds voting stays open after it starts
// Default: 120 seconds = 2 minutes (change via VOTING_DURATION_SECONDS in .env)
const VOTING_DURATION_SECONDS =
  parseInt(process.env.VOTING_DURATION_SECONDS) || 120;

// ---- Track voting timing ----
// We record when the server started so we can calculate the countdown
const serverStartTime = Date.now();

// Calculate the exact moment voting opens and closes
const votingOpensAt = serverStartTime + VOTING_DELAY_SECONDS * 1000;
const votingClosesAt = votingOpensAt + VOTING_DURATION_SECONDS * 1000;

// ============================================================
// MIDDLEWARE
// ============================================================
// Middleware = functions that run BEFORE your route handlers

// Enable CORS so the frontend can make API calls
app.use(cors());

// Parse JSON request bodies (needed for POST requests)
app.use(express.json());

// Serve static frontend files (HTML, CSS, JS, images)
// path.join ensures the path works on all operating systems
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ============================================================
// HELPER FUNCTION: Get current voting status
// ============================================================
function getVotingStatus() {
  const now = Date.now();

  if (now < votingOpensAt) {
    // Voting hasn't started yet — show countdown
    return {
      status: "waiting",
      message: "Voting has not started yet",
      opensAt: votingOpensAt,
      closesAt: votingClosesAt,
      remainingMs: votingOpensAt - now,
    };
  } else if (now >= votingOpensAt && now < votingClosesAt) {
    // Voting is currently open
    return {
      status: "open",
      message: "Voting is open!",
      opensAt: votingOpensAt,
      closesAt: votingClosesAt,
      remainingMs: votingClosesAt - now,
    };
  } else {
    // Voting has closed
    return {
      status: "closed",
      message: "Voting has ended",
      opensAt: votingOpensAt,
      closesAt: votingClosesAt,
      remainingMs: 0,
    };
  }
}

// ============================================================
// API ROUTES
// ============================================================

/* ---------- GET / ----------
   Serve the main HTML page.
   When someone visits http://localhost:3000, they get index.html.
*/
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

/* ---------- GET /api/health ----------
   Health check endpoint.
   Used by cloud platforms to verify the server is running.
   Also returns voting timing info.
*/
app.get("/api/health", (req, res) => {
  const votingStatus = getVotingStatus();
  res.json({
    status: "ok",
    message: "VoteApp server is running",
    uptime: Math.floor((Date.now() - serverStartTime) / 1000) + " seconds",
    voting: votingStatus,
  });
});

/* ---------- POST /api/vote ----------
   Cast a vote for a candidate.
   Expects JSON body: { "candidate": "Candidate A" }
   Inserts a row into the "votes" table in MySQL.
*/
app.post("/api/vote", async (req, res) => {
  try {
    // Check if voting is open
    const votingStatus = getVotingStatus();
    if (votingStatus.status === "waiting") {
      return res.status(403).json({
        success: false,
        message: "Voting has not started yet. Please wait for the countdown.",
        voting: votingStatus,
      });
    }
    if (votingStatus.status === "closed") {
      return res.status(403).json({
        success: false,
        message: "Voting has ended. No more votes can be cast.",
        voting: votingStatus,
      });
    }

    // Extract the candidate name from the request body
    const { candidate } = req.body;

    // Validate: make sure a candidate name was provided
    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: "Please provide a candidate name",
      });
    }

    // List of valid candidate names
    const validCandidates = ["Candidate A", "Candidate B", "Candidate C"];

    // Validate: make sure the candidate is one of our three options
    if (!validCandidates.includes(candidate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate. Must be: " + validCandidates.join(", "),
      });
    }

    // Insert the vote into the MySQL database
    // The ? is a placeholder that prevents SQL injection attacks
    await pool.execute("INSERT INTO votes (candidate) VALUES (?)", [candidate]);

    // Send success response back to the browser
    res.json({
      success: true,
      message: "Vote recorded for " + candidate,
    });
  } catch (error) {
    // If something goes wrong, log the error and send a 500 response
    console.error("Error recording vote:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to record vote. Please try again.",
    });
  }
});

/* ---------- GET /api/results ----------
   Get the vote count for each candidate.
   Returns an array like:
   [ { candidate: "Candidate A", votes: 5 }, ... ]
   Also returns current voting status.
*/
app.get("/api/results", async (req, res) => {
  try {
    // SQL query: count votes grouped by candidate name
    const [rows] = await pool.execute(
      "SELECT candidate, COUNT(*) AS votes FROM votes GROUP BY candidate ORDER BY votes DESC"
    );

    // Get the current voting status
    const votingStatus = getVotingStatus();

    // Send the results and status back as JSON
    res.json({
      success: true,
      results: rows,
      voting: votingStatus,
    });
  } catch (error) {
    console.error("Error fetching results:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch results",
    });
  }
});

/* ---------- POST /api/reset ----------
   Reset all votes (delete every row from the votes table).
   Used by admins to start a fresh election.
*/
app.post("/api/reset", async (req, res) => {
  try {
    // DELETE removes all rows from the votes table
    await pool.execute("DELETE FROM votes");

    res.json({
      success: true,
      message: "All votes have been reset",
    });
  } catch (error) {
    console.error("Error resetting votes:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to reset votes",
    });
  }
});

// ============================================================
// START THE SERVER
// ============================================================
app.listen(PORT, () => {
  console.log("============================================");
  console.log("  VoteApp Server is running!");
  console.log("  URL:    http://localhost:" + PORT);
  console.log("  Health: http://localhost:" + PORT + "/api/health");
  console.log("============================================");
  console.log("  Voting opens in " + VOTING_DELAY_SECONDS + " seconds");
  console.log("  Voting duration: " + VOTING_DURATION_SECONDS + " seconds");
  console.log("============================================");
});
