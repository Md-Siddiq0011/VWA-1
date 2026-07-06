# TN 2031 Legislative Assembly Voting System

Version: VWA-2

VWA-2 is a beginner-friendly voting web application built with HTML, CSS, JavaScript, Node.js, Express.js, and MySQL. It is designed as a learning project and keeps the main logic inside `server.js`, `db.js`, and `frontend/js/app.js`.

## Features

- User registration and login
- Password hashing with bcrypt
- Dynamic candidates loaded from MySQL
- One user, one vote
- Voting confirmation before submit
- Admin login using `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Candidate add, edit, delete with image upload
- Candidate changes allowed only when election is closed
- Election start, stop, and reset controls
- Admin dashboard with total voters, submitted votes, remaining users, and leading candidate
- Live results page
- Automatic database table creation on server startup
- Automatic `frontend/assets/uploads/` folder creation
- Standard API response format
- Docker and Northflank deployment support

## Project Structure

```text
frontend/
  index.html
  login.html
  register.html
  admin.html
  results.html
  css/style.css
  js/app.js
  assets/images/
  assets/uploads/

backend/
  server.js
  db.js
  package.json
  Dockerfile

database/
  schema.sql
```

## API Response Format

Success:

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": ""
}
```

## API List

| Method | API | Purpose |
|---|---|---|
| GET | `/api/health` | Server and database health check |
| POST | `/api/register` | Register a voter |
| POST | `/api/login` | Login a voter |
| GET | `/api/candidates` | Load candidates |
| POST | `/api/vote` | Submit vote |
| GET | `/api/results` | Load live results |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/dashboard` | Admin dashboard numbers |
| POST | `/api/admin/candidate/add` | Add candidate with optional image |
| PUT | `/api/admin/candidate/update/:id` | Update candidate |
| DELETE | `/api/admin/candidate/delete/:id` | Delete candidate |
| POST | `/api/admin/election/start` | Open voting |
| POST | `/api/admin/election/stop` | Close voting |
| POST | `/api/admin/election/reset` | Clear votes and voter status |

## Database Tables

### users

- `id`
- `name`
- `email`
- `password`
- `has_voted`
- `created_at`

### candidates

- `id`
- `name`
- `party`
- `description`
- `image`
- `votes`
- `created_at`

### election

- `id`
- `status`

The server automatically creates these tables when it starts. `database/schema.sql` is still included for learning and manual practice.

## Environment Variables

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=voteapp
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Admin fallback values are:

- username: `admin`
- password: `admin123`

## Local Run Commands

Install dependencies:

```bash
cd backend
npm install
```

Create `.env` from the example:

```bash
copy ..\.env.example ..\.env
```

Start the server:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Docker Run

From the project root:

```bash
docker compose up --build
```

Open:

```text
http://localhost:3000
```

## Northflank Deployment Steps

1. Push this project to GitHub.
2. Create a Northflank MySQL addon.
3. Create a Northflank service from the GitHub repository.
4. Set the Dockerfile path to `backend/Dockerfile`.
5. Add these environment variables from the MySQL addon:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
6. Add admin variables:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
7. Deploy the service.
8. Open the Northflank service URL.

The frontend uses:

```js
const API_URL = window.location.origin;
```

So it works on both `localhost` and the Northflank URL without changing code.
