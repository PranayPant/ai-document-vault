# AI Document Vault - Backend API

This is the backend service for the AI Document Vault, a system designed to upload documents, extract their content, and generate AI-powered summaries and structured Markdown.

## 🚀 Quick Start

### Prerequisites
- Node.js (v20 or v22 LTS recommended)
- pnpm (recommended) or npm

### Installation

1. **Install Dependencies**
   ```bash
   cd backend
   pnpm install
   ```

2. **Environment Setup**
   Create a `.env` file in the `backend` folder with the following content:
   ```env
   DATABASE_URL="file:./dev.db"
   PORT=3001
   ANTHROPIC_API_KEY="" 
   # Leave API Key empty to use "Mock Mode" (simulated AI)
   ```

3. **Database Setup**
   Initialize the Prisma Client and create the local SQLite database:
   ```bash
   pnpm generate   # Generates the Prisma Client
   pnpm db:push    # Pushes schema to the local SQLite file
   ```

4. **Start the Server**
   ```bash
   pnpm start      # Production start
   # OR
   pnpm dev        # Development mode with hot-reload
   ```

   The server will start at `http://localhost:3001`.

---

## 🏗 Architecture & Design Decisions

This backend is built using a **Service-Oriented Architecture** with **Node.js (Express)** and **TypeScript**.

### 1. Core Services
The business logic is decoupled from the HTTP layer (Controllers) and organized into specialized services:

*   **`StorageService`**: Handles raw file I/O operations. In this prototype, it manages the local file system (`/uploads`). In production, this service would be swapped to use the AWS S3 SDK.
*   **`QueueService`**: Manages asynchronous background processing. It acts as both the Producer (adding jobs during upload) and the Consumer/Worker (processing jobs to generate AI insights).
*   **`AIService`**: Encapsulates interactions with the LLM (Anthropic Claude). It handles text extraction (OCR/Parsing) and prompt engineering to generate summaries and markdown.
*   **`DatabaseService` (via Prisma)**: Manages metadata, relationships, and structured AI outputs using SQLite (Prototype) or PostgreSQL (Production).

### 2. Application Flows
Here is a detailed breakdown of how data moves through the system:

#### **Flow A: Upload & Process (Asynchronous)**
*   **Trigger**: Client uploads a file via the UI.
*   **Route**: `POST /api/documents`
*   **Controller**: `DocumentController.upload`
*   **Execution**:
    1.  **Storage**: Middleware saves the raw file to disk/S3.
    2.  **Database**: Controller creates a `Document` record with status `QUEUED`.
    3.  **Queue**: Controller calls `QueueService` to add a background job.
    4.  **Response**: Immediate `202 Accepted` returned to client (Non-blocking).
*   **Background Worker**:
    1.  `QueueService` picks up the job.
    2.  Updates status to `PROCESSING`.
    3.  Calls `AIService` to extract text and generate insights.
    4.  Updates Database with `summary`, `markdown`, and status `COMPLETED`.

#### **Flow B: List Documents**
*   **Trigger**: Client loads the Dashboard/Explorer view.
*   **Route**: `GET /api/documents`
*   **Controller**: `DocumentController.getAll`
*   **Execution**:
    1.  **Database**: Fetches metadata for all documents, ordered by date.
    2.  **Transformation**: Maps the data to a DTO, constructing the `downloadUrl` for the frontend.
*   **Response**: JSON Array of document metadata.

#### **Flow C: View Single Document**
*   **Trigger**: User clicks a specific file to view details.
*   **Route**: `GET /api/documents/:id`
*   **Controller**: `DocumentController.getOne`
*   **Execution**:
    1.  **Database**: Fetches the specific record, including the large text fields (`summary`, `markdown`).
*   **Response**: JSON Object containing the AI-generated content.

---

## 🔮 Optimizations & Production Readiness

For the scope of this prototype, several features were intentionally omitted to focus on the core architectural patterns. In a production environment, the following would be required:

1.  **Pagination & Filtering**:
    *   *Current*: `GET /documents` returns all records.
    *   *Production*: Implement cursor-based pagination (e.g., `take: 20, cursor: 'id'`) to handle thousands of documents without performance degradation.

2.  **Authentication & Authorization (AuthN/AuthZ)**:
    *   *Current*: The API is public.
    *   *Production*: Integrate JWT/OAuth (e.g., Auth0 or Supabase Auth) to ensure users can only access their own documents.

3.  **Input Validation**:
    *   *Current*: Basic checks for file existence.
    *   *Production*: Use libraries like `Zod` or `Joi` to strictly validate request bodies and file types (e.g., preventing executables from being uploaded).

4.  **Rate Limiting**:
    *   *Current*: Unbounded.
    *   *Production*: Implement rate limiting (e.g., `express-rate-limit` or Redis-based) to prevent abuse of the expensive AI API.

5.  **Delete & Cleanup**:
    *   *Current*: Files remain indefinitely.
    *   *Production*: Add `DELETE /api/documents/:id` which transactionally removes the record from the DB and the file from S3.

6.  **Error Handling**:
    *   *Current*: Basic try/catch blocks.
    *   *Production*: A global Exception Filter to normalize error responses (Standardized HTTP 4xx/5xx codes).

---

## ⚖️ Prototype vs. Production Strategy

| Component | Prototype Implementation (Current) | Production Strategy (Future) |
| :--- | :--- | :--- |
| **Database** | **SQLite** <br> *Zero setup, file-based.* | **PostgreSQL (AWS RDS)** <br> *Better concurrency and JSON search capabilities.* |
| **File Storage** | **Local Disk** (`/uploads`) <br> *Served via Express Static.* | **AWS S3** <br> *Scalable object storage.* |
| **Job Queue** | **In-Memory** <br> *No external dependencies needed to run.* | **Redis (BullMQ)** <br> *Persistent queue to handle server restarts/crashes.* |
| **Uploads** | **Multipart/Form-Data** <br> *Direct to backend.* | **Presigned URLs** <br> *Client uploads directly to S3 to offload server bandwidth.* |

---

## 🛠 Troubleshooting

### "Could not locate the bindings file"
If you see an error about `better-sqlite3` bindings, it means the binary wasn't compiled for your specific Node version/OS. Run this command:

```bash
pnpm rebuild better-sqlite3
```

### Prisma Version Mismatch
If you see errors about "url missing" or schema validation:
1. Ensure you are running commands via `pnpm exec` (e.g., `pnpm exec prisma generate`) to use the local version.
2. Ensure you have run `pnpm install` to get the specific versions defined in `package.json`.