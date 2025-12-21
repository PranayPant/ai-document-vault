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

### 🧪 Testing Uploads
You can test the API immediately using curl:
```bash
curl -X POST -F "file=@/path/to/your/document.pdf" -F "filePath=/Work/Projects/Q1/doc.pdf" http://localhost:3001/api/documents
```

---

## 🏗 Architecture & Design Decisions

This backend is built using a **Service-Oriented Architecture** with **Node.js (Express)** and **TypeScript**.

### 1. Core Services
The business logic is decoupled from the HTTP layer (Controllers) and organized into specialized services:

*   **`StorageService`**: Handles physical file I/O. In this prototype, it acts as a "dumb" blob store using the local file system (`/uploads`). In production, this would use AWS S3. It knows **nothing** about folders or hierarchy.
*   **`MetadataService`**: Manages the **Logical Layer**. It handles the Folder/File hierarchy (Relational DB), stores AI metadata, and manages "Soft Deletes". It maps User Paths (Virtual) to Storage Paths (Physical).
*   **`QueueService`**: Manages asynchronous background processing. It acts as both the Producer (adding jobs during upload) and the Consumer/Worker (processing jobs to generate AI insights).
*   **`AIService`**: Encapsulates interactions with the LLM (Anthropic Claude). It handles text extraction (OCR/Parsing) and prompt engineering to generate summaries and markdown.

### 2. The "Decoupled Path" Architecture
A core design choice was decoupling the **User's Virtual Path** from the **Physical Storage Path**.

1.  **Virtual Path (User Intent):** `/Work/Projects/2024/Report.pdf`
    *   Stored in the database via a recursive `Folder` model.
    *   Allows instant renaming of folders (O(1) operation) without moving physical files.
2.  **Physical Path (Storage Reality):** `uuid-123-456.pdf`
    *   Stored flatly in `/uploads` (or S3 Bucket).
    *   Prevents filename collisions and OS directory limit issues.

### 3. Application Flows

#### **Flow A: Upload & Process (Asynchronous)**
*   **Trigger**: Client uploads a file with a virtual path (e.g., `/Finance/Q1/budget.pdf`).
*   **Route**: `POST /api/documents`
*   **Controller**: `DocumentController.upload`
*   **Execution**:
    1.  **Storage**: Saves binary to disk as `uuid-blob.pdf`.
    2.  **Metadata**: 
        *   Parses path `/Finance/Q1`.
        *   **"Find or Create"**: Recursively checks if folders exist (checking `[Name + ParentId]` uniqueness). If not, creates them.
        *   Creates `Document` record linked to the specific Folder ID.
    3.  **Queue**: Adds background job.
    4.  **Response**: Immediate `202 Accepted`.
*   **Background Worker**:
    *   Updates status `QUEUED` -> `PROCESSING` -> `COMPLETED`.
    *   Generates AI Summary/Markdown.
    *   Saves results via `MetadataService`.

#### **Flow B: Folder Navigation (Tree View)**
*   **Trigger**: User expands a folder (e.g., "Finance").
*   **Route**: `GET /api/folders/:folderId` (or `.../root` for top level).
*   **Controller**: `DocumentController.getFolder`
*   **Logic**:
    *   Fetches **Lightweight Metadata** only via `MetadataService`.
    *   Returns a list of active Sub-folders and File Names inside the target folder.
    *   Used strictly for navigation; does not load file content or heavy AI text.

#### **Flow C: File Selection (Leaf Node)**
*   **Trigger**: User clicks a specific file (e.g., "budget.pdf").
*   **Route**: `GET /api/documents/:id`
*   **Controller**: `DocumentController.getOne`
*   **Logic**:
    *   Fetches **Heavy Metadata** (AI Summary, Markdown).
    *   Generates a **Download URL** (link to StorageService).
*   **Response**: Composite Object (Metadata + Content Link) used to render the Split View UI.

---

## 🔮 Optimizations & Production Readiness

For the scope of this prototype, several features were intentionally omitted or simplified:

1.  **Soft Deletes vs. Hard Deletes**:
    *   *Implemented*: **Soft Deletes**. When a user deletes a file/folder, we set a `deletedAt` timestamp in the DB. The item disappears from the UI instantly.
    *   *Production Needed*: A **Cron Job** (Garbage Collector) to permanently remove "Soft Deleted" files from S3 and the Database after 30 days.

2.  **Pagination**:
    *   *Current*: Folder contents are returned in full.
    *   *Production*: Cursor-based pagination for folders containing thousands of files.

3.  **Authentication (AuthN/AuthZ)**:
    *   *Current*: Public API.
    *   *Production*: JWT/OAuth integration. `MetadataService` would need to filter results by `userId`.

4.  **Input Validation**:
    *   *Current*: Basic checks.
    *   *Production*: `Zod` validation for strict path checking and file type whitelisting.

5.  **Rate Limiting**:
    *   *Current*: Unbounded.
    *   *Production*: Implement rate limiting (e.g., Redis-based) to prevent abuse of the expensive AI API.

---

## ⚖️ Prototype vs. Production Strategy

| Component | Prototype Implementation (Current) | Production Strategy (Future) |
| :--- | :--- | :--- |
| **Database** | **SQLite** <br> *Zero setup, file-based.* | **PostgreSQL (AWS RDS)** <br> *Better concurrency, JSON search, and recursive CTEs.* |
| **File Storage** | **Local Disk** (`/uploads`) <br> *Served via Express Static.* | **AWS S3** <br> *Scalable object storage.* |
| **Job Queue** | **In-Memory** <br> *No external dependencies.* | **Redis (BullMQ)** <br> *Persistent queue for reliability.* |
| **Uploads** | **Multipart/Form-Data** <br> *Direct to backend.* | **Presigned URLs** <br> *Client uploads directly to S3.* |

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