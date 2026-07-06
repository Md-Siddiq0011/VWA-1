/* ============================================================
   server.js - TN 2031 Legislative Assembly backend
   ============================================================
   Simple Express server for:
   - user register/login
   - one-user-one-vote
   - admin dashboard and candidate management
   - election start/stop/reset
   ============================================================ */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { initDatabase, getPool } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

const frontendPath = path.join(__dirname, "..", "frontend");
const uploadFolder = path.join(frontendPath, "assets", "uploads");

// Automatically create uploads folder so missing folders do not crash uploads.
fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, uploadFolder);
  },
  filename: function (req, file, callback) {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    callback(null, safeName);
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(frontendPath));

function success(res, message, data = {}) {
  return res.json({ success: true, message, data });
}

function failure(res, statusCode, error) {
  return res.status(statusCode).json({ success: false, error });
}

function friendlyDbError(res) {
  return failure(res, 500, "Database disconnected");
}

async function getElectionStatus() {
  const db = getPool();
  const [rows] = await db.query("SELECT status FROM election WHERE id = 1");
  return rows[0] ? rows[0].status : "closed";
}

function imagePathFromFile(file) {
  if (!file) {
    return null;
  }
  return "/assets/uploads/" + file.filename;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/api/health", async (req, res) => {
  try {
    return success(res, "Server is running", {
      app: "TN 2031 Legislative Assembly",
      electionStatus: await getElectionStatus(),
    });
  } catch (error) {
    return friendlyDbError(res);
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return failure(res, 400, "Name, email and password are required");
    }

    const db = getPool();
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (existing.length > 0) {
      return failure(res, 409, "Email already registered");
    }

    // TESTING ONLY: storing original password directly

await pool.query(
  "INSERT INTO users (name,email,password) VALUES (?,?,?)",
  [name, email, password]
);

  } catch (error) {
    console.error(error.message);
    return friendlyDbError(res);
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return failure(res, 400, "Email and password are required");
    }

    const db = getPool();
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return failure(res, 401, "Invalid email or password");
    }

    const user = users[0];

    // Password security:
    // During login, bcrypt compares the typed password with the stored hash.
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return failure(res, 401, "Invalid email or password");
    }

    return success(res, "Login successful", {
      userId: user.id,
      name: user.name,
      email: user.email,
      hasVoted: !!user.has_voted,
    });
  } catch (error) {
    console.error(error.message);
    return friendlyDbError(res);
  }
});

app.get("/api/candidates", async (req, res) => {
  try {
    const db = getPool();
    const [candidates] = await db.query(
      "SELECT id, name, party, description, image, votes FROM candidates ORDER BY id"
    );
    return success(res, "Candidates loaded", { candidates });
  } catch (error) {
    console.error(error.message);
    return friendlyDbError(res);
  }
});

app.post("/api/vote", async (req, res) => {
  try {
    const { userId, candidateId } = req.body;

    if (!userId) {
      return failure(res, 401, "Login required");
    }

    if (!candidateId) {
      return failure(res, 400, "Candidate is required");
    }

    const db = getPool();
    const status = await getElectionStatus();

    if (status !== "open") {
      return failure(res, 403, "Election closed");
    }

    const [users] = await db.query("SELECT has_voted FROM users WHERE id = ?", [
      userId,
    ]);

    if (users.length === 0) {
      return failure(res, 401, "Login required");
    }

    if (users[0].has_voted) {
      return failure(res, 409, "Already voted");
    }

    const [candidates] = await db.query(
      "SELECT id FROM candidates WHERE id = ?",
      [candidateId]
    );

    if (candidates.length === 0) {
      return failure(res, 404, "Candidate not found");
    }

    await db.query("UPDATE candidates SET votes = votes + 1 WHERE id = ?", [
      candidateId,
    ]);
    await db.query("UPDATE users SET has_voted = TRUE WHERE id = ?", [userId]);

    return success(res, "Vote submitted successfully");
  } catch (error) {
    console.error(error.message);
    return friendlyDbError(res);
  }
});

app.get("/api/results", async (req, res) => {
  try {
    const db = getPool();
    const [results] = await db.query(
      "SELECT id, name, party, image, votes FROM candidates ORDER BY votes DESC, id ASC"
    );
    return success(res, "Results loaded", {
      electionStatus: await getElectionStatus(),
      results,
    });
  } catch (error) {
    console.error(error.message);
    return friendlyDbError(res);
  }
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (username === adminUsername && password === adminPassword) {
    return success(res, "Admin login successful", { admin: true });
  }

  return failure(res, 401, "Invalid admin credentials");
});

app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const db = getPool();
    const [[userCount]] = await db.query("SELECT COUNT(*) AS total FROM users");
    const [[candidateCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM candidates"
    );
    const [[voteCount]] = await db.query(
      "SELECT COALESCE(SUM(votes), 0) AS total FROM candidates"
    );
    const [[remainingCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM users WHERE has_voted = FALSE"
    );
    const [leaders] = await db.query(
      "SELECT name, party, votes FROM candidates ORDER BY votes DESC, id ASC LIMIT 1"
    );

    return success(res, "Dashboard loaded", {
      totalUsers: userCount.total,
      totalCandidates: candidateCount.total,
      totalVotes: Number(voteCount.total),
      totalVoters: userCount.total,
      votesSubmitted: Number(voteCount.total),
      remainingUsers: remainingCount.total,
      leadingCandidate: leaders[0] || null,
      electionStatus: await getElectionStatus(),
    });
  } catch (error) {
    console.error(error.message);
    return friendlyDbError(res);
  }
});

app.post(
  "/api/admin/candidate/add",
  upload.single("image"),
  async (req, res) => {
    try {
      if ((await getElectionStatus()) === "open") {
        return failure(
          res,
          403,
          "Cannot modify candidates while election is running"
        );
      }

      const { name, party, description } = req.body;
      if (!name || !party) {
        return failure(res, 400, "Candidate name and party are required");
      }

      const db = getPool();
      const image = imagePathFromFile(req.file) || "";
      const [result] = await db.query(
        "INSERT INTO candidates (name, party, description, image) VALUES (?, ?, ?, ?)",
        [name, party, description || "", image]
      );

      return success(res, "Candidate added", { candidateId: result.insertId });
    } catch (error) {
      console.error(error.message);
      return friendlyDbError(res);
    }
  }
);

app.put(
  "/api/admin/candidate/update/:id",
  upload.single("image"),
  async (req, res) => {
    try {
      if ((await getElectionStatus()) === "open") {
        return failure(
          res,
          403,
          "Cannot modify candidates while election is running"
        );
      }

      const { name, party, description } = req.body;
      const image = imagePathFromFile(req.file);
      const db = getPool();

      if (image) {
        await db.query(
          "UPDATE candidates SET name = ?, party = ?, description = ?, image = ? WHERE id = ?",
          [name, party, description || "", image, req.params.id]
        );
      } else {
        await db.query(
          "UPDATE candidates SET name = ?, party = ?, description = ? WHERE id = ?",
          [name, party, description || "", req.params.id]
        );
      }

      return success(res, "Candidate updated");
    } catch (error) {
      console.error(error.message);
      return friendlyDbError(res);
    }
  }
);

app.delete("/api/admin/candidate/delete/:id", async (req, res) => {
  try {
    if ((await getElectionStatus()) === "open") {
      return failure(
        res,
        403,
        "Cannot modify candidates while election is running"
      );
    }

    const db = getPool();
    await db.query("DELETE FROM candidates WHERE id = ?", [req.params.id]);
    return success(res, "Candidate deleted");
  } catch (error) {
    console.error(error.message);
    return friendlyDbError(res);
  }
});

app.post("/api/admin/election/start", async (req, res) => {
  try {
    const db = getPool();
    await db.query("UPDATE election SET status = 'open' WHERE id = 1");
    return success(res, "Election started");
  } catch (error) {
    console.error(error.message);
    return friendlyDbError(res);
  }
});

app.post("/api/admin/election/stop", async (req, res) => {
  try {
    const db = getPool();
    await db.query("UPDATE election SET status = 'closed' WHERE id = 1");
    return success(res, "Election stopped");
  } catch (error) {
    console.error(error.message);
    return friendlyDbError(res);
  }
});

app.post("/api/admin/election/reset", async (req, res) => {
  try {
    const db = getPool();
    await db.query("UPDATE candidates SET votes = 0");
    await db.query("UPDATE users SET has_voted = FALSE");
    await db.query("UPDATE election SET status = 'closed' WHERE id = 1");
    return success(res, "Election reset");
  } catch (error) {
    console.error(error.message);
    return friendlyDbError(res);
  }
});

async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log("TN 2031 Legislative Assembly server running on port " + PORT);
    });
  } catch (error) {
    console.error("Server did not start because the database is disconnected.");
  }
}

startServer();
