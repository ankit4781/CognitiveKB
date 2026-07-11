# AI-Powered Knowledge Base Assistant (CognitiveKB)

CognitiveKB is a beautiful, modern, and production-oriented Full Stack Web Application that allows users to upload documents (PDF, Plain Text, and Markdown) and ask AI-powered contextual questions about them using Google's Gemini SDK.

The system parses, processes, and stores document contents inside a database and implements a **Retrieval-Augmented Generation (RAG)** approach. Users can choose to query a specific document or get answers across their entire repository.

---

## Technical Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Axios.
- **Backend**: Node.js, Express, TypeScript, Mongoose, Multer, PDF-Parse, Google Generative AI SDK.
- **Database**: MongoDB (runs a zero-config database in memory by default, or connects to external MongoDB via URI).
- **Authentication**: Stateless JSON Web Tokens (JWT).
- **Containerization**: Docker & Docker Compose configurations.

---

## Features

- **JWT Authentication**: Registration, Login, token verification, and automated routing guards.
- **Document Manager**: Drag-and-drop file upload, size checks, format validation, document lists, text previewing, and document deletion.
- **AI Chat Assistant**: Ask context-specific questions, markdown rendering for response bubbles, animated typing bubbles, and dynamic context selections.
- **Collapsible Logs**: View past questions, search through history, and instantly restore old conversation contexts.
- **Analytical Dashboard**: Visual representation of format breakdown, storage capacity tracking, parsed word indices, and recent activities.
- **Docker Support**: Build and launch the database, server, and web client with a single command.
- **Robust Fallbacks**: Works seamlessly in **Demo Mode** if a Gemini API Key is missing. Connects to an **In-Memory MongoDB Server** if no local MongoDB is running, offering true plug-and-play evaluation.

---

## Environment Variables

Create a `.env` file in `/backend` (an example `.env.example` is supplied):

```env
# Server Config
PORT=5000
NODE_ENV=development

# Database Config
# Keep empty to run in-memory MongoDB dynamically!
MONGODB_URI=

# Authentication Config
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Gemini AI Config
# Get a free key from: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or 20)
- MongoDB running locally (Optional, falls back to in-memory database)

### Installation & Launch

1. **Install all packages** (runs root, backend, and frontend installs simultaneously):
   ```bash
   # In the root folder C:\Users\ankit\.gemini\antigravity-ide\scratch\ai-knowledge-base-assistant
   npm install
   ```

2. **Boot the complete stack**:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to: **`http://localhost:3000`**


## How to Run with Docker

Run the entire suite including MongoDB instantly:

```bash
# In the root project folder
docker-compose up --build
```

Access the frontend at `http://localhost:3000` (mapped to port 80 inside the container) and the backend at `http://localhost:5000`.

---

## Running Automated Tests

Run the test suite inside the backend directory:
```bash
cd backend
npm run test
```

---

## Design Decisions
- **In-Memory database fallback**: Added `mongodb-memory-server` to allow a developer evaluating the code to run the application immediately without local database installations.
- **API Key Fail-Soft**: Implemented a mock simulation answer mode if `GEMINI_API_KEY` is not filled in backend `.env` so that pages and forms don't crash and instead guide the user on how the AI works.
- **Client-Side Text Storage**: Text content parsed from documents is saved in MongoDB rather than files on disk, ensuring portability across server instances.
- **Custom Markdown Parser**: Built a clean, custom inline markdown parsing engine to avoid module bundler issues in React+TS and keep bundle sizes light.
