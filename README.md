# Cloud Drop

Cloud Drop is a full-stack file upload and download application built with React, Node.js, Express, Cloudinary, and MongoDB Atlas.  
Users can upload any file type, view a list of uploaded files, download them from Cloudinary, and delete them (removing both the Cloudinary asset and metadata in MongoDB).

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
- **Deployment**
  - Frontend: Vercel
  - Backend: Render
  - Database: MongoDB Atlas

---

## Project Structure

```text
.
├─ client/    # Vite + React frontend
├─ server/    # Express + MongoDB + Cloudinary backend
└─ README.md
```

---

## API Endpoints

All endpoints are prefixed with your backend base URL (e.g. `http://localhost:5000` in development).

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
- `fileName` – Filename stored in Cloudinary
- `mimeType` – MIME type of the uploaded file
- `size` – File size in bytes
- `cloudinaryUrl` – Public HTTPS URL of the file on Cloudinary
- `publicId` – Cloudinary public ID (used for deletion)
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

- Node.js (v18+ recommended)
- npm or yarn
- A MongoDB Atlas cluster
- A Cloudinary account

---

### 1. Clone the Repository

```bash
cd /home/deadly/Projects
git clone <your-repo-url> cloud-drop
cd cloud-drop
```

> Make sure the root contains exactly: `client/`, `server/`, and `README.md`.

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

1. Open a new terminal and navigate to the frontend:

   ```bash
   cd /home/deadly/Projects/cloud-drop/client
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
| `CLIENT_URLS`           | Comma-separated allowed origins for CORS | `http://localhost:5173,https://yourvercel.app`                   |

### Frontend (`/client/.env`)

| Variable       | Description                 | Example                 |
| -------------- | --------------------------- | ----------------------- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000` |

---

## Database Setup (MongoDB Atlas)

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new project and a free/shared cluster.
3. Create a database user with a strong password and **Network Access** rules that allow your IP or your deployment platform.
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

4. Files uploaded from the app will be stored under the `cloud-drop` folder in your Cloudinary account.

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
5. Cloudinary returns metadata (secure URL, public ID), which is saved along with file details and user ID in MongoDB.
6. The frontend retrieves user's files using `GET /api/files` (only returns files owned by the authenticated user).
7. Clicking **Download** opens the Cloudinary URL in a new tab.
8. Clicking **Delete** calls `DELETE /api/files/:id`, which verifies ownership and removes the file from Cloudinary and then from MongoDB.

### Security Features

- **Password Hashing**: All passwords are hashed using bcrypt before storage.
- **JWT Authentication**: Secure token-based authentication.
- **User Isolation**: Each user can only access their own files.
- **Protected Routes**: All file endpoints require valid JWT token.
- **Password Exclusion**: Passwords are never returned in API responses.

---

