# 🏗️ Architecture — VoteApp Single Service

This document explains the technical architecture of the VoteApp.

---

## Overview

VoteApp follows a **monolithic single-service architecture**. Everything runs in one process:

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER (User)                    │
│                                                      │
│  index.html  ←→  style.css  ←→  script.js           │
│                      │                                │
│              HTTP Requests (fetch)                    │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              EXPRESS.JS SERVER (Node.js)              │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  Static File Middleware                       │    │
│  │  Serves: index.html, style.css, script.js,   │    │
│  │          images/candidate-*.jpg               │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  API Routes                                   │    │
│  │  GET  /api/health   → Health check            │    │
│  │  POST /api/vote     → Record a vote           │    │
│  │  GET  /api/results  → Get vote counts         │    │
│  │  POST /api/reset    → Delete all votes        │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  Voting Timer Logic                           │    │
│  │  Tracks: serverStartTime, votingOpensAt,      │    │
│  │          votingClosesAt                        │    │
│  └──────────────────────────────────────────────┘    │
│                       │                              │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│                  MySQL DATABASE                       │
│                                                      │
│  Database: voteapp                                   │
│  Table: votes                                        │
│  ┌────────┬───────────────┬─────────────────────┐    │
│  │ id     │ candidate     │ voted_at            │    │
│  │ (INT)  │ (VARCHAR 100) │ (TIMESTAMP)         │    │
│  │ AUTO   │ NOT NULL      │ DEFAULT NOW()       │    │
│  └────────┴───────────────┴─────────────────────┘    │
│                                                      │
│  Connection: mysql2/promise connection pool           │
│  Max connections: 10                                 │
└──────────────────────────────────────────────────────┘
```

---

## How the Frontend Works

### Files

| File         | Purpose                                    |
|-------------|---------------------------------------------|
| `index.html` | Page structure with sections for candidates, results, admin |
| `style.css`  | Dark theme, glassmorphism, animations, responsive grid |
| `script.js`  | Candidate rendering, voting, results polling, countdown timer |

### Data Flow (Frontend → Backend)

1. **Page Load** → `script.js` calls `init()` → renders candidate cards
2. **Every 3 seconds** → `fetchResults()` calls `GET /api/results`
3. **User clicks Vote** → `castVote()` calls `POST /api/vote`
4. **User clicks Reset** → `resetVotes()` calls `POST /api/reset`

### Timer Logic

The countdown timer works by:
1. The backend calculates `votingOpensAt` and `votingClosesAt` timestamps
2. These timestamps are sent to the frontend via the `/api/results` response
3. `script.js` uses `setInterval()` to update the timer display every second
4. When a countdown reaches zero, `fetchResults()` refreshes the status

---

## How the Backend Works

### Express Middleware Stack

```
Request → CORS → JSON Parser → Static Files → Route Handler → Response
```

1. **CORS** — Allows cross-origin requests (needed for development)
2. **JSON Parser** — Converts JSON request bodies to JavaScript objects
3. **Static Files** — Serves frontend files from `../frontend/`
4. **Route Handlers** — Process API requests

### Voting Status Machine

The server tracks three states:

```
[WAITING] ──(delay expires)──→ [OPEN] ──(duration expires)──→ [CLOSED]
```

- **WAITING**: Server just started, countdown is running
- **OPEN**: Users can cast votes
- **CLOSED**: No more votes accepted, winner is displayed

---

## How the Database Works

### Connection Pool (db.js)

- Uses `mysql2/promise` for async/await syntax
- Creates a pool of 10 reusable connections
- Reads connection details from environment variables
- Tests the connection on startup

### SQL Operations

```sql
-- Insert a vote
INSERT INTO votes (candidate) VALUES ('Candidate A')

-- Count votes per candidate
SELECT candidate, COUNT(*) AS votes
FROM votes
GROUP BY candidate
ORDER BY votes DESC

-- Reset all votes
DELETE FROM votes
```

---

## How Docker Works

### Container Layout

```
┌─────────────────────────────────┐
│  Docker Compose                  │
│                                  │
│  ┌──────────┐    ┌──────────┐   │
│  │ app      │    │ db       │   │
│  │ (Node.js)│───→│ (MySQL)  │   │
│  │ :3000    │    │ :3306    │   │
│  └──────────┘    └──────────┘   │
│        │               │        │
│        │          ┌─────┘        │
│        │          ▼              │
│        │    mysql-data (volume)  │
│        ▼                         │
│   Host :3000                     │
└─────────────────────────────────┘
```

### Build Process

1. Docker reads `backend/Dockerfile`
2. Starts from `node:20-alpine` base image
3. Copies `package.json` first (for cache optimization)
4. Runs `npm install`
5. Copies frontend + backend source code
6. Sets startup command: `node backend/server.js`

### Startup Sequence

1. MySQL container starts first
2. Health check verifies MySQL is ready (`mysqladmin ping`)
3. Node.js container starts after MySQL is healthy
4. Express server connects to MySQL and begins serving

---

## Security Considerations

1. **SQL Injection Prevention** — Uses parameterized queries (`?` placeholders)
2. **Environment Variables** — Passwords stored in `.env`, not in code
3. **Input Validation** — Only accepts valid candidate names
4. **CORS** — Can be configured to restrict origins in production
5. **No Authentication** — This is a learning project; add auth for production use
