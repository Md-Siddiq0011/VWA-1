# 🗳️ VoteApp — Single Service Voting Web Application

A **simple, beginner-friendly, production-ready** Full Stack Voting Web Application built as **ONE SERVICE**.

Every line of code is commented for learning. Perfect for beginners who want to understand how full-stack web applications work.

---

## ✨ Features

- ✅ **Three Candidates** — Vote for Candidate A, B, or C
- ✅ **Live Results** — See votes update in real-time with animated progress bars
- ✅ **Countdown Timer** — Configurable delay before voting opens
- ✅ **Auto-Close** — Voting automatically closes after a set duration
- ✅ **Winner Display** — Announces the winner when voting ends
- ✅ **Reset Votes** — Admin button to clear all votes and start fresh
- ✅ **Responsive Design** — Works beautifully on desktop, tablet, and mobile
- ✅ **Dark Theme** — Premium dark UI with glassmorphism effects
- ✅ **MySQL Storage** — All votes stored in a real database (not memory)
- ✅ **Docker Ready** — Start with one command: `docker compose up --build`
- ✅ **Cloud Ready** — Deploy to Render, Railway, Northflank, or Koyeb

---

## 🏗️ Architecture

```
Browser (User)
      │
      ▼
HTML / CSS / JavaScript   ← Frontend (served by Express)
      │
      ▼
Express.js Server         ← Backend (Node.js)
      │
      ▼
MySQL Database            ← Persistent storage
```

**One backend serves everything.** No microservices. No API gateway. Simple and clean.

---

## 📁 Project Structure

```
Voting-Web-App-Single-Service/
├── frontend/                  # Everything the browser sees
│   ├── index.html             # Main HTML page
│   ├── style.css              # All styles (dark theme, responsive)
│   ├── script.js              # All JavaScript logic
│   └── images/                # Candidate photos
│       ├── candidate-a.jpg
│       ├── candidate-b.jpg
│       └── candidate-c.jpg
├── backend/                   # Server-side code
│   ├── server.js              # Express server + API routes
│   ├── db.js                  # MySQL connection pool
│   ├── package.json           # Node.js dependencies
│   └── Dockerfile             # Docker build instructions
├── database/
│   └── schema.sql             # Database table creation script
├── docker-compose.yml         # Run everything with Docker
├── .env.example               # Environment variables template
├── .gitignore                 # Files excluded from Git
├── .dockerignore              # Files excluded from Docker
├── README.md                  # This file
├── ARCHITECTURE.md            # Technical architecture details
├── DEPLOYMENT.md              # Cloud deployment guide
├── PROJECT-HISTORY.md         # Project development history
└── LICENSE                    # MIT License
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

The easiest way to run everything — just one command:

```bash
# Clone the repository
git clone https://github.com/your-username/Voting-Web-App-Single-Service.git
cd Voting-Web-App-Single-Service

# Start everything (backend + MySQL)
docker compose up --build
```

Open your browser: **http://localhost:3000**

To stop:
```bash
docker compose down
```

### Option 2: Manual (Without Docker)

You need MySQL installed and running locally.

```bash
# Step 1: Clone the repository
git clone https://github.com/your-username/Voting-Web-App-Single-Service.git
cd Voting-Web-App-Single-Service

# Step 2: Create the database
mysql -u root -p < database/schema.sql

# Step 3: Set up environment variables
cp .env.example backend/.env
# Edit backend/.env with your MySQL credentials

# Step 4: Install Node.js dependencies
cd backend
npm install

# Step 5: Start the server
npm start
```

Open your browser: **http://localhost:3000**

---

## 🔌 API Endpoints

| Method | Endpoint       | Description                          |
|--------|----------------|--------------------------------------|
| GET    | `/`            | Serves the frontend (index.html)     |
| GET    | `/api/health`  | Health check + voting status         |
| POST   | `/api/vote`    | Cast a vote `{ "candidate": "..." }` |
| GET    | `/api/results` | Get vote counts for all candidates   |
| POST   | `/api/reset`   | Delete all votes                     |

---

## ⚙️ Configuration

All settings are controlled via environment variables (`.env` file):

| Variable                 | Default     | Description                           |
|--------------------------|-------------|---------------------------------------|
| `PORT`                   | `3000`      | Server port                           |
| `DB_HOST`                | `localhost` | MySQL hostname                        |
| `DB_PORT`                | `3306`      | MySQL port                            |
| `DB_USER`                | `root`      | MySQL username                        |
| `DB_PASSWORD`            | `password`  | MySQL password                        |
| `DB_NAME`                | `voteapp`   | Database name                         |
| `VOTING_DELAY_SECONDS`   | `10`        | Seconds before voting opens           |
| `VOTING_DURATION_SECONDS`| `120`       | Seconds voting stays open             |

---

## 🧰 Tech Stack

| Layer      | Technology     | Purpose                              |
|------------|----------------|--------------------------------------|
| Frontend   | HTML5          | Page structure                       |
| Frontend   | CSS3           | Styling and animations               |
| Frontend   | Vanilla JS     | Interactive behavior                 |
| Backend    | Node.js        | JavaScript runtime                   |
| Backend    | Express.js     | Web framework + API                  |
| Database   | MySQL          | Vote storage                         |
| DevOps     | Docker         | Containerization                     |
| DevOps     | Docker Compose | Multi-container orchestration        |

---

## 📚 Learning Resources

This project is built for learning. Every file contains detailed comments explaining:

- **What** each line does
- **Why** it's needed
- **How** it connects to other parts

Start reading in this order:
1. `frontend/index.html` — The page structure
2. `frontend/style.css` — How it looks
3. `frontend/script.js` — How it behaves
4. `backend/server.js` — The API and server
5. `backend/db.js` — Database connection
6. `database/schema.sql` — Database structure
7. `docker-compose.yml` — Container orchestration

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
