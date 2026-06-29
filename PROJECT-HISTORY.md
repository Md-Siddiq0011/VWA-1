# 📖 Project History — VoteApp

This document records the development history and decisions made during the creation of VoteApp.

---

## Version 1.0.0 — Initial Release

**Date**: June 2026

### What Was Built

A complete, production-ready voting web application running as a single service.

### Key Decisions

#### 1. Why Single Service (Not Microservices)?

**Decision**: Build everything as ONE Express server.

**Reason**: This project is for learning. A single service is:
- Easier to understand (one codebase, one server)
- Easier to deploy (one container, one URL)
- Easier to debug (one log output, one process)
- Perfectly adequate for a small application

Microservices add complexity (API gateways, service discovery, inter-service communication) that isn't needed here.

#### 2. Why MySQL (Not MongoDB, PostgreSQL, or SQLite)?

**Decision**: Use MySQL as the database.

**Reason**:
- MySQL is one of the most popular databases in the world
- SQL is a universal skill that transfers to other databases
- Clear structure with tables, rows, and columns
- Excellent for structured data (like votes)
- Wide support on cloud platforms

#### 3. Why Vanilla JavaScript (Not React/Vue/Angular)?

**Decision**: Use plain HTML, CSS, and JavaScript. No frameworks.

**Reason**:
- Frameworks add a build step and complexity
- You can't understand React until you understand the DOM
- Vanilla JS teaches fundamentals that apply everywhere
- The app is simple enough that a framework isn't needed
- Easier to reverse-engineer and learn from

#### 4. Why Express.js Serves the Frontend?

**Decision**: Use `express.static()` instead of a separate web server (Nginx).

**Reason**:
- One server = simpler architecture
- One Docker container = easier deployment
- Express handles static files efficiently for our scale
- Cloud platforms expect one service per deployment

#### 5. Why Docker?

**Decision**: Include Docker and Docker Compose for development.

**Reason**:
- `docker compose up` starts everything with one command
- No need to install MySQL locally
- Consistent environment across all developers' machines
- Same setup works in production (cloud deployment)

#### 6. Why Environment Variables?

**Decision**: Use `.env` files and `process.env` for configuration.

**Reason**:
- Keeps passwords out of the code (security)
- Same code works in development and production
- Cloud platforms set environment variables automatically
- Industry standard practice (12-factor app methodology)

---

### Technology Stack Rationale

| Choice          | Alternative Considered | Why We Chose This                    |
|-----------------|----------------------|---------------------------------------|
| Express.js      | Fastify, Hapi        | Most popular, most tutorials, easiest to learn |
| MySQL           | PostgreSQL, MongoDB  | Most widely known, SQL is universal   |
| Vanilla JS      | React, Vue           | No build step, teaches fundamentals   |
| Docker Compose  | Kubernetes            | Simplicity, perfect for development   |
| dotenv          | Config files          | Industry standard, cloud-compatible   |

---

### What's NOT Included (And Why)

| Feature              | Why Not Included                                     |
|----------------------|------------------------------------------------------|
| User Authentication  | Adds complexity; focus is on voting logic             |
| Rate Limiting        | Important for production but adds code to learn       |
| WebSockets           | Polling (setInterval) is simpler to understand        |
| TypeScript           | Adds a compile step; plain JS is more beginner-friendly |
| ORM (Sequelize)      | Raw SQL is more educational; ORMs hide the database   |
| Testing Framework    | Would be a great v2 addition                          |
| CI/CD Pipeline       | Out of scope for v1; documented in DEPLOYMENT.md      |

---

## Future Improvements (v2 Ideas)

- [ ] Add user authentication (login/register)
- [ ] Add rate limiting (one vote per user)
- [ ] Add WebSocket for real-time results (instead of polling)
- [ ] Add unit tests with Jest
- [ ] Add CI/CD pipeline with GitHub Actions
- [ ] Add Nginx as a reverse proxy
- [ ] Add SSL/HTTPS support
- [ ] Add admin dashboard with charts
- [ ] Add multiple election support
- [ ] Add vote verification (receipts)
