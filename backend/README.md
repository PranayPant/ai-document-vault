# AI Document Vault - Backend API

This is the backend service for the AI Document Vault, a system designed to upload documents, extract their content, and generate AI-powered summaries and structured Markdown.

## 🏗 Architecture & Design Decisions

This backend is built using a **Service-Oriented Architecture** with **Node.js (Express)** and **TypeScript**.

### 1. Core Services
The business logic is decoupled from the HTTP layer (Controllers) and organized into specialized services:

*   **`StorageService`**: Handles physical file I/O. In this prototype, it acts as a "dumb" blob store using the local file system (`/uploads`). In production, this would use AWS S3. It knows **nothing** about folders or hierarchy.
*   **`MetadataService`**: Manages the **Logical Layer**. It handles the Folder/File hierarchy (Relational DB), stores AI metadata. It maps User Paths (Virtual) to Storage Paths (Physical).
*   **`QueueService`**: Manages asynchronous background processing. It acts as both the Producer (adding jobs during upload) and the Consumer/Worker (processing jobs to generate AI insights). Makes it easy to integrate a real queue like RabbitMQ in later iterations.
*   **`AIService`**: Encapsulates interactions with the LLM (Anthropic Claude). It handles text extraction (OCR/Parsing) and prompt engineering to generate summaries and markdown.

### 2. The "Relational" Architecture
A core design choice was separating the **Logical Hierarchy** from the **Physical Storage**.

1.  **Logical Hierarchy (User Intent):** `Folder ID: A -> Folder ID: B`
    *   Managed by **SQLite/Prisma** via a recursive `Folder` model.
    *   Folders are linked via Foreign Keys (`parentId`), not path strings.
    *   Allows instant renaming of folders (O(1) operation) and efficient tree traversal.
2.  **Physical Storage (System Reality):** `uuid-123-456.pdf`
    *   Managed by **StorageService** (Local Disk / S3).
    *   Files are stored flatly using unique UUIDs to prevent filename collisions.
    *   The database maps the Logical `FolderId` to the Physical `StoragePath`.

### 3. Application Flows

#### **Flow A: Upload & Process (Nested Support)**
*   **Trigger**: User uploads a file (or drops a folder structure) into a specific parent folder.
*   **Route**: `POST /api/documents`
*   **Payload**: `file` (Binary), `parentFolderId` (UUID), `filePath` (Relative path, e.g., "SubFolder/doc.pdf").
*   **Execution**:
    1.  **Storage**: Saves binary to disk as `uuid-blob.pdf`.
    2.  **Metadata**: 
        *   **Relative Resolution**: Parses the `filePath` relative to the `parentFolderId`.
        *   **Structural Deduplication (Folder Reuse Strategy)**: 
            *   Instead of blindly creating new folders for every upload (which would fail or create duplicates), the service uses an **Iterative Upsert**.
            *   **The Check**: *"Does 'SubFolder' already exist inside the current parent?"* 
            *   **If Yes:** It **reuses the existing UUID** and does nothing to the folder record.
            *   **If No:** It creates a new folder.
            *   *Result:* The new file is placed inside the existing folder structure, keeping the tree clean and normalized.
        *   **Link**: Creates a `Document` record linked to the final specific Folder ID.
    3.  **Queue**: Adds background job.
    4.  **Response**: Immediate `202 Accepted`.
*   **Background Worker**:
    *   Updates status `QUEUED` -> `PROCESSING` -> `COMPLETED`.
    *   Generates AI Summary/Markdown.

#### **Flow B: Folder Navigation (Optimized Tree View)**
*   **Trigger**: User expands a folder (e.g., "Finance").
*   **Route**: `GET /api/folders/:folderId` (or `.../root` for top level).
*   **Controller**: `DocumentController.getFolder`
*   **Logic**:
    *   **Single Query Optimization**: Uses a JOIN (Prisma `include`) to fetch the current folder, its sub-folders, and its documents in **one database round-trip**.
    *   **Lightweight**: Selects only necessary fields (IDs, Names) for the list view, excluding heavy AI text blobs.

#### **Flow C: File Selection (Leaf Node)**
*   **Trigger**: User clicks a specific file to read.
*   **Route**: `GET /api/documents/:id`
*   **Controller**: `DocumentController.getOne`
*   **Logic**:
    *   Fetches **Heavy Metadata** (AI Summary, Markdown).
    *   Generates **Two Access URLs**:
        1.  `previewUrl`: For inline rendering (PDF Viewer/iFrame).
        2.  `downloadUrl`: For forcing a "Save As" file download.
*   **Response**: Composite Object used to render the Split View UI.

## 💾 Database Strategy

This project implements a **Hybrid Database & Split Storage Architecture** to balance rapid local development with production-grade scalability.

### 1. Metadata Database (Relational Layer)
We use **Prisma ORM** to abstract the database layer, allowing us to switch underlying engines without rewriting application logic.

*   **Prototype (Current): SQLite**
    *   **Why:** Zero configuration. It runs as a single file (`dev.db`) directly on the local disk. This makes the project "clone-and-run" friendly for reviewers without needing to install Docker.
    *   **Function:** Stores structured data:
        *   **Folder Hierarchy:** Implements a **Self-Referencing Parent-Child Relationship** via Foreign Keys (Adjacency List pattern).
        *   **Document Metadata:** Filenames, file sizes, MIME types, and timestamps.
        *   **AI Insights:** Stores generated summaries and markdown for fast retrieval.

*   **Production (Target): PostgreSQL**
    *   **Why:** SQLite has concurrent write limitations. PostgreSQL handles scale and offers advanced features:
        *   **Efficient Tree Traversal:** Uses Common Table Expressions (CTEs) to fetch deep nested folder structures in a single, highly optimized query.
        *   **JSONB:** Efficiently indexing unstructured AI metadata.
        *   **Vector Search (pgvector):** Future-proofing the app to allow "Semantic Search" across documents.

### 2. Object Storage (Physical Layer)
We strictly decouple **Logical Metadata** (in the DB) from **Physical Content** (in Storage).

*   **Prototype (Current): Local File System**
    *   **Implementation:** The `StorageService` writes files to a local `/uploads` directory.
    *   **Why:** Avoids the need for cloud credentials (AWS keys) during the review process.

*   **Production (Target): AWS S3**
    *   **Implementation:** The `StorageService` would be swapped to use the AWS SDK.
    *   **Serving:** We would generate **Presigned URLs**, allowing clients to download directly from AWS S3. This offloads 100% of the file transfer traffic from our Node.js API.

### 3. Why Split Metadata & Storage?
1.  **Performance:** Databases are optimized for structured queries, not streaming MBs of binary data. Storing files in the DB bloats the cache and slows down simple queries (like "List Folders").
2.  **Cost:** Database storage is significantly more expensive than Object Storage (S3).
3.  **Backups:** Decoupling allows us to backup metadata (frequently) separate from the massive file blobs (incrementally).

## 🔮 Optimizations & Production Readiness

For the scope of this prototype, several features were intentionally omitted or simplified:

1.  **Soft Deletes and Hard Deletes**:
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