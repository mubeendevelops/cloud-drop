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

| Method | Path             | Description                            |
| ------ | ---------------- | -------------------------------------- |
| POST   | `/api/upload`    | Upload a single file                   |
| GET    | `/api/files`     | Get list of all uploaded files         |
| GET    | `/api/files/:id` | Get metadata for a specific file by ID |
| DELETE | `/api/files/:id` | Delete a file (Cloudinary + MongoDB)   |

### File Schema (MongoDB)

Each file document in the `File` collection contains:

- `originalName` – Original filename from the user
- `fileName` – Filename stored in Cloudinary
- `mimeType` – MIME type of the uploaded file
- `size` – File size in bytes
- `cloudinaryUrl` – Public HTTPS URL of the file on Cloudinary
- `publicId` – Cloudinary public ID (used for deletion)
- `createdAt` – Upload timestamp

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

1. User selects or drags & drops a file in the frontend.
2. File is sent via `POST /api/upload` to the backend.
3. Backend uses Multer to read the file into memory, then streams it to Cloudinary.
4. Cloudinary returns metadata (secure URL, public ID), which is saved along with file details in MongoDB.
5. The frontend retrieves stored files using `GET /api/files` and displays them in a list.
6. Clicking **Download** opens the Cloudinary URL in a new tab.
7. Clicking **Delete** calls `DELETE /api/files/:id`, which removes the file from Cloudinary and then from MongoDB.

---

