# ============================================================
# Dockerfile — Backend Container
# ============================================================
# This file tells Docker HOW to build our application container.
# Think of it as a recipe: step-by-step instructions to create
# a working environment for our Node.js app.
# ============================================================

# ---- Step 1: Choose the base image ----
# We start from an official Node.js image (Alpine = lightweight Linux)
# node:20-alpine is small (~50MB) and has everything Node needs
FROM node:20-alpine

# ---- Step 2: Set the working directory ----
# All following commands will run inside /app in the container
WORKDIR /app

# ---- Step 3: Copy package files first (for Docker caching) ----
# Docker caches each step. If package.json hasn't changed,
# Docker reuses the cached npm install (saves time!)
COPY backend/package.json backend/package-lock.json* ./backend/

# ---- Step 4: Install dependencies ----
# Run npm install inside the backend directory
RUN cd backend && npm install --production

# ---- Step 5: Copy the rest of our code ----
# Now copy the actual source code (frontend + backend)
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# ---- Step 6: Expose the port ----
# Tell Docker which port our app listens on
# This doesn't actually publish the port — it's documentation
EXPOSE 3000

# ---- Step 7: Start the application ----
# This command runs when the container starts
# "node backend/server.js" starts our Express server
CMD ["node", "backend/server.js"]
