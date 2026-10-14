# Cloud Drop

Cloud Drop is a full-stack file upload and download application built with React, Node.js, Express, Cloudinary, and MongoDB Atlas.  
Users can upload any file type, view a list of uploaded files, download them from Cloudinary, and delete them (removing both the Cloudinary asset and metadata in MongoDB).

**Live demo:** [m-cloud-drop.vercel.app](https://m-cloud-drop.vercel.app) (the API runs on Render's free tier, so the first request after a quiet spell can take up to a minute; see [Free-tier cold starts](#free-tier-cold-starts)).

[![CI](https://github.com/mubeendevelops/cloud-drop/actions/workflows/ci.yml/badge.svg)](https://github.com/mubeendevelops/cloud-drop/actions/workflows/ci.yml)

---

## Tech Stack

- **Frontend**
  - React
  - Vite
  - JavaScript
  - Axios
  - Minimal plain CSS
- **Backend**
  - Node.js
  - Express.js
  - Multer
  - Cloudinary
  - MongoDB Atlas
  - Mongoose
  - dotenv
  - cors
  - jsonwebtoken (JWT authentication)
  - bcryptjs (password hashing)
  - helmet (security headers)
  - express-rate-limit (login and register limits)
- **Quality**
  - ESLint (both projects)
  - node:test, supertest and mongodb-memory-server (API tests)
  - GitHub Actions (lint, build and tests on every push and pull request)
- **Deployment**
  - Frontend: Vercel
  - Backend: Render
  - Database: MongoDB Atlas

---

## Project Structure

```text
.
├─ .github/workflows/ci.yml   # CI: install, lint, client build, server tests
├─ client/                    # Vite + React frontend
├─ server/                    # Express + MongoDB + Cloudinary backend
│  └─ test/                   # API tests
├─ render.yaml                # Render service settings
└─ README.md
```

---

## API Endpoints

All endpoints are prefixed with your backend base URL (e.g. `http://localhost:5000` in development).

### Status Endpoints (Public)

| Method | Path      | Description                                                        |
| ------ | --------- | ------------------------------------------------------------------ |
| GET    | `/`       | API name and endpoint list                                         |
| GET    | `/health` | Always 200: `{"status":"ok","db":"connected"}`, or `"degraded"` with the database state |

### Authentication Endpoints (Public)

| Method | Path                | Description                    |
| ------ | ------------------- | ------------------------------ |
| POST   | `/api/auth/register` | Register a new user            |
| POST   | `/api/auth/login`     | Login and get JWT token        |
| GET    | `/api/auth/me`       | Get current user (requires auth) |

### File Endpoints (Protected - Requires Authentication)

All file endpoints require a JWT token in the Authorization header: `Authorization: Bearer <token>`

| Method | Path             | Description                            |
| ------ | ---------------- | -------------------------------------- |
| POST   | `/api/upload`    | Upload a single file (user-specific)   |
| GET    | `/api/files`     | Get list of current user's files       |
| GET    | `/api/files/:id` | Get metadata for a specific file by ID (only if owned by user) |
| DELETE | `/api/files/:id` | Delete a file (Cloudinary + MongoDB) (only if owned by user)   |

### File Schema (MongoDB)

Each file document in the `File` collection contains:

- `user` – Reference to the User who uploaded the file (ObjectId)
- `originalName` – Original filename from the user
- `fileName` – Last segment of the Cloudinary public ID (a random UUID, plus the extension for raw files)
- `mimeType` – MIME type of the uploaded file
- `size` – File size in bytes
- `cloudinaryUrl` – Public HTTPS URL of the file on Cloudinary
- `publicId` – Cloudinary public ID, `cloud-drop/<user id>/<uuid>[.ext]` (used for deletion)
- `resourceType` – Cloudinary resource type: `image`, `video` or `raw` (needed to delete the asset; defaults to `image` for old records)
- `createdAt` – Upload timestamp

### User Schema (MongoDB)

Each user document in the `User` collection contains:

- `email` – User's email address (unique, lowercase)
- `password` – Hashed password (bcrypt)
- `name` – User's name
- `createdAt` – Account creation timestamp
- `updatedAt` – Last update timestamp

---

## Local Development Setup

### Prerequisites

- Node.js 22 or newer (both `package.json` files require it)
- npm
- A MongoDB Atlas cluster
- A Cloudinary account

---

### 1. Clone the Repository

```bash
git clone https://github.com/mubeendevelops/cloud-drop.git
cd cloud-drop
```

There is no `package.json` at the root; `client/` and `server/` are separate npm projects.

---

### 2. Backend Setup (`/server`)

1. Navigate to the backend folder:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your `.env` file:

   ```bash
   cp .env.example .env
   ```

4. Fill in `.env` with your own values:

   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cloud_drop?retryWrites=true&w=majority

   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d

   CLIENT_URLS=http://localhost:5173
   ```

5. Start the backend server:

   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:5000`.

---

### 3. Frontend Setup (`/client`)

1. Open a new terminal in the repository root and navigate to the frontend:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your `.env` file:

   ```bash
   cp .env.example .env
   ```

4. Ensure the API URL points to your backend:

   ```env
   VITE_API_URL=http://localhost:5000
   ```

5. Start the Vite dev server:

   ```bash
   npm run dev
   ```

6. Open the frontend in your browser (typically):

   ```text
   http://localhost:5173
   ```

---

## Environment Variables

### Backend (`/server/.env`)

| Variable                | Description                              | Example                                                          |
| ----------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `PORT`                  | Port for the Express server              | `5000`                                                           |
| `MONGODB_URI`           | MongoDB Atlas connection string          | `mongodb+srv://user:pass@cluster/db?retryWrites=true&w=majority` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                    | `my-cloud-name`                                                  |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                       | `1234567890`                                                     |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                    | `my-secret`                                                      |
| `JWT_SECRET`            | Secret key for signing JWT tokens       | `your_super_secret_jwt_key_here`                                 |
| `JWT_EXPIRE`            | JWT token expiration time (optional)     | `7d` (default: 7 days)                                           |
| `CLIENT_URLS`           | Comma-separated allowed origins for CORS. Empty allows every origin in development and blocks every browser origin in production | `http://localhost:5173,https://yourvercel.app`                   |
| `NODE_ENV`              | Set to `production` on the host          | `production`                                                     |

The server refuses to start, and names the missing ones, if `MONGODB_URI`, `JWT_SECRET` or any of the three Cloudinary variables is unset.

### Frontend (`/client/.env`)

| Variable       | Description                 | Example                 |
| -------------- | --------------------------- | ----------------------- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000` |

Vite bakes `VITE_API_URL` into the bundle at build time, so changing it only takes effect after a new build (locally: restart `npm run dev`).

---

## Database Setup (MongoDB Atlas)

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new project and a free/shared cluster.
3. Create a database user with a strong password. Under **Network Access**, allow your own IP for local development. For Render's free tier, which has no fixed outbound IP, the entry must be `0.0.0.0/0` (access is then protected by the database user's password).
4. Copy the connection string from **Connect → Drivers**, replace `<username>` and `<password>`, and place it in `MONGODB_URI` in `server/.env`:

   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cloud_drop?retryWrites=true&w=majority
   ```

5. The app will automatically create and use the `cloud_drop` database and `files` collection when you first upload a file.

---

## Cloudinary Setup

1. Sign up or log in at [Cloudinary](https://cloudinary.com/).
2. In your Cloudinary dashboard, locate your **Cloud name**, **API Key**, and **API Secret**.
3. Add them to `server/.env`:

   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Files uploaded from the app will be stored under the `cloud-drop` folder in your Cloudinary account, each under `cloud-drop/<user id>/<random id>`. The original file name is kept only in MongoDB.
5. **Allow PDF and ZIP delivery.** New free Cloudinary accounts block delivery of PDF and ZIP files by default, so links to those files return 401 even though the upload succeeds. In the Cloudinary console open **Settings → Security** and enable **Allow delivery of PDF and ZIP files**.
6. Uploads are limited to 10 MB per file, which is the free plan's limit for image and raw files.

---

## Limits

| Limit | Value | Enforced in |
| --- | --- | --- |
| File size | 10 MB per file (413 above it) | `server/middleware/uploadMiddleware.js`, mirrored in `client/src/utils/fileUtils.js` |
| Files per user | 50 (403 above it) | `server/controllers/fileController.js` |
| Storage per user | 100 MB (403 above it) | `server/controllers/fileController.js` |
| Login and register | 10 requests per 15 minutes per IP, counted separately (429 above it) | `server/middleware/rateLimitMiddleware.js` |
| Password | At least 6 characters | `server/controllers/authController.js` |
| Request timeout (client) | 20 s, uploads 5 minutes | `client/src/services/api.js` |

---

## Linting and Tests

Both projects have an ESLint flat config (`eslint.config.js`):

```bash
cd server && npm run lint
cd ../client && npm run lint
```

The server has an API test suite in `server/test/` (register and login, file ownership isolation, upload validation and quota). It runs against an in-memory MongoDB with Cloudinary mocked, so it needs no `.env` and no network access apart from the one-time download of the MongoDB binary by `mongodb-memory-server`:

```bash
cd server
npm test
```

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, lint and tests for the server, and `npm ci`, lint and build for the client on every push and pull request.

---

## Deployment

The live app uses Vercel for the frontend, Render for the API, MongoDB Atlas and Cloudinary. Render auto-deploys `main`, and a Git-connected Vercel project builds every push to `main` as production, so treat a push to `main` as a release and work on a branch until then.

### Frontend on Vercel

| Setting | Value |
| --- | --- |
| Root Directory | `client` |
| Framework Preset | Vite (its defaults below) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Environment variable | `VITE_API_URL=https://cloud-drop.onrender.com` (your Render URL, no trailing slash) |

`VITE_API_URL` is read at build time. After changing it in the Vercel dashboard, **redeploy** (Deployments → ⋯ → Redeploy); the running site keeps the old value until then.

### Backend on Render

The settings are recorded in [`render.yaml`](render.yaml):

| Setting | Value |
| --- | --- |
| Service type | Web service, Node, free plan |
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Auto-Deploy | On, for `main` |

Environment variables (set in the Render dashboard; secrets are never committed):

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | A long random string, different from your local one |
| `JWT_EXPIRE` | `7d` (no inline comment; the dashboard does not strip one) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | From the Cloudinary console |
| `CLIENT_URLS` | `https://m-cloud-drop.vercel.app` (your Vercel URL, exactly, comma-separated if more than one) |

Do not set `PORT`; Render provides it.

### MongoDB Atlas

Network Access must include `0.0.0.0/0`, because Render's free tier has no fixed outbound IP. Atlas pauses free clusters after a long period without activity; a paused cluster's hostname stops resolving and the API exits on boot with `FATAL: could not connect to MongoDB`. Resume it from the Atlas dashboard.

### Cloudinary

Enable **Settings → Security → Allow delivery of PDF and ZIP files**, or links to PDF and ZIP uploads return 401 (see [Cloudinary Setup](#cloudinary-setup)).

### Free-tier cold starts

Render's free web services sleep after about 15 minutes without traffic. The next request wakes the service, which takes up to about a minute; meanwhile the client shows "The server is not responding. It may be waking up; try again in a minute." An external uptime monitor that requests `/health` every few minutes keeps the service awake.

### Checking a deployment

```bash
curl https://cloud-drop.onrender.com/health
# {"status":"ok","db":"connected"}
```

---

## How the App Works

### Authentication Flow

1. User registers via `POST /api/auth/register` with email, password, and name.
2. Backend hashes the password using bcrypt and creates a user in MongoDB.
3. JWT token is generated and returned to the client.
4. User logs in via `POST /api/auth/login` with email and password.
5. Backend verifies credentials and returns a JWT token.
6. Client stores the token and includes it in subsequent requests: `Authorization: Bearer <token>`

### File Upload Flow

1. User selects or drags & drops a file in the frontend.
2. File is sent via `POST /api/upload` with JWT token in Authorization header.
3. Backend verifies JWT token and extracts user ID.
4. Backend uses Multer to read the file into memory, then streams it to Cloudinary.
5. The per-user quota is checked first. Cloudinary then returns metadata (secure URL, public ID, resource type), which is saved along with file details and user ID in MongoDB.
6. The frontend retrieves user's files using `GET /api/files` (only returns files owned by the authenticated user).
7. Clicking **Download** saves the file under its original name.
8. Clicking **Delete** calls `DELETE /api/files/:id`, which verifies ownership and removes the file from Cloudinary and then from MongoDB.

### Security Features

- **Password Hashing**: All passwords are hashed using bcrypt before storage.
- **JWT Authentication**: Secure token-based authentication.
- **User Isolation**: Each user can only access their own files.
- **Protected Routes**: All file endpoints require valid JWT token.
- **Password Exclusion**: Passwords are never returned in API responses.
- **Generic Login Error**: An unknown email and a wrong password get the same "Invalid email or password" response.
- **Rate Limiting**: Login and register are limited per IP.
- **Security Headers**: `helmet` sets standard headers; CORS only allows the origins in `CLIENT_URLS`.
- **Quotas**: Per-file size limit and per-user file and storage caps.

---

