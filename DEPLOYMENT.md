# 🚀 Deployment Guide — VoteApp

This guide explains how to deploy VoteApp to various cloud platforms as a **single service**.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Preparing for Deployment](#preparing-for-deployment)
3. [Deploy to Render](#deploy-to-render)
4. [Deploy to Railway](#deploy-to-railway)
5. [Deploy to Northflank](#deploy-to-northflank)
6. [Deploy to Koyeb](#deploy-to-koyeb)
7. [Environment Variables Reference](#environment-variables-reference)

---

## Prerequisites

Before deploying, make sure you have:

- ✅ A GitHub account with your code pushed to a repository
- ✅ An account on the cloud platform you want to use
- ✅ A MySQL database (most platforms offer managed MySQL add-ons)

---

## Preparing for Deployment

### Step 1: Push Your Code to GitHub

```bash
cd Voting-Web-App-Single-Service
git init
git add .
git commit -m "Initial commit: VoteApp single service"
git remote add origin https://github.com/YOUR-USERNAME/Voting-Web-App-Single-Service.git
git push -u origin main
```

### Step 2: Set Up a MySQL Database

Most cloud platforms provide managed MySQL databases. You'll need:
- **Host** — The database server address
- **Port** — Usually 3306
- **Username** — Database user
- **Password** — Database password
- **Database name** — Usually `voteapp`

### Step 3: Run the Schema

Connect to your cloud MySQL database and run `database/schema.sql` to create the table:

```bash
mysql -h YOUR_DB_HOST -u YOUR_DB_USER -p YOUR_DB_NAME < database/schema.sql
```

---

## Deploy to Render

[Render](https://render.com) is great for beginners — free tier available.

### Steps:

1. **Create a New Web Service**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure the Service**
   - **Name**: `voteapp`
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Root Directory**: (leave empty)

3. **Add a MySQL Database**
   - Render offers PostgreSQL natively. For MySQL, use a provider like:
     - [PlanetScale](https://planetscale.com) (free tier)
     - [Aiven](https://aiven.io) (free trial)
     - [Railway MySQL](https://railway.app)

4. **Set Environment Variables**
   - Go to "Environment" tab and add:
     ```
     DB_HOST=your-mysql-host
     DB_PORT=3306
     DB_USER=your-username
     DB_PASSWORD=your-password
     DB_NAME=voteapp
     VOTING_DELAY_SECONDS=10
     VOTING_DURATION_SECONDS=120
     ```

5. **Deploy** — Render will auto-deploy from your GitHub `main` branch

---

## Deploy to Railway

[Railway](https://railway.app) is developer-friendly with built-in MySQL.

### Steps:

1. **Create a New Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Add MySQL**
   - In your project, click "New" → "Database" → "Add MySQL"
   - Railway auto-creates the database and sets environment variables

3. **Configure the Service**
   - Click on your service → "Settings"
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Watch Paths**: `/backend/**`, `/frontend/**`

4. **Set Environment Variables**
   - Railway auto-provides: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
   - Map them to your variable names:
     ```
     DB_HOST=${{MySQL.MYSQLHOST}}
     DB_PORT=${{MySQL.MYSQLPORT}}
     DB_USER=${{MySQL.MYSQLUSER}}
     DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
     DB_NAME=${{MySQL.MYSQLDATABASE}}
     VOTING_DELAY_SECONDS=10
     VOTING_DURATION_SECONDS=120
     ```

5. **Run the Schema**
   - Use Railway's MySQL connection string to run `schema.sql`

---

## Deploy to Northflank

[Northflank](https://northflank.com) offers a free tier with managed databases.

### Steps:

1. **Create a Project**
   - Go to [northflank.com](https://northflank.com)
   - Create a new project

2. **Create a MySQL Addon**
   - In your project, go to "Addons" → "Create Addon"
   - Select "MySQL" and configure

3. **Create a Service**
   - Go to "Services" → "Create Service" → "Combined Service"
   - Connect your GitHub repository
   - **Build**: Dockerfile (point to `backend/Dockerfile`)
   - **Or Build manually**:
     - Build Command: `cd backend && npm install`
     - Start Command: `cd backend && node server.js`

4. **Set Environment Variables**
   - Link the MySQL addon connection details
   - Add voting configuration variables

5. **Deploy**

---

## Deploy to Koyeb

[Koyeb](https://koyeb.com) offers instant deployment with a free tier.

### Steps:

1. **Create a New App**
   - Go to [app.koyeb.com](https://app.koyeb.com)
   - Click "Create App" → "GitHub"
   - Select your repository

2. **Configure Build**
   - **Builder**: Dockerfile or Buildpack
   - If Buildpack:
     - **Build Command**: `cd backend && npm install`
     - **Run Command**: `cd backend && node server.js`

3. **Add a MySQL Database**
   - Use an external MySQL provider (PlanetScale, Aiven, etc.)

4. **Set Environment Variables**
   - Add all DB_* and VOTING_* variables

5. **Deploy** — Koyeb handles the rest

---

## Environment Variables Reference

These environment variables must be set on your cloud platform:

| Variable                  | Required | Description                        |
|---------------------------|----------|------------------------------------|
| `PORT`                    | Auto     | Set automatically by the platform  |
| `DB_HOST`                 | Yes      | MySQL server hostname              |
| `DB_PORT`                 | Yes      | MySQL port (usually 3306)          |
| `DB_USER`                 | Yes      | MySQL username                     |
| `DB_PASSWORD`             | Yes      | MySQL password                     |
| `DB_NAME`                 | Yes      | Database name (voteapp)            |
| `VOTING_DELAY_SECONDS`    | No       | Countdown before voting (default: 10) |
| `VOTING_DURATION_SECONDS` | No       | How long voting is open (default: 120) |

---

## Troubleshooting

### "Cannot connect to MySQL"
- Verify your DB_HOST, DB_PORT, DB_USER, DB_PASSWORD are correct
- Make sure the MySQL database is running and accessible from your cloud platform
- Check if you need to whitelist your service's IP address

### "Table 'voteapp.votes' doesn't exist"
- You need to run `database/schema.sql` against your MySQL database
- Connect to MySQL and execute: `SOURCE database/schema.sql;`

### "Port already in use"
- Don't set PORT manually on cloud platforms — they provide it automatically
- Only set PORT for local development

### "Application crashes on startup"
- Check the logs on your cloud platform
- Make sure all environment variables are set
- Verify MySQL is reachable from your deployment
