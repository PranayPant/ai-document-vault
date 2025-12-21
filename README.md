# AI Document Vault

A full-stack document management system with AI-powered summaries and intelligent file organization. Upload documents, browse them in a hierarchical structure, and get instant AI-generated insights.

## 🎯 Overview

**AI Document Vault** combines a modern React frontend with a robust Node.js backend to provide:

- **Easy Upload**: Drag-and-drop file uploads
- **Smart Navigation**: Tree-based folder structure with route-based navigation
- **AI Insights**: Automatic summarization and markdown conversion powered by Anthropic's Claude
- **Seamless Experience**: Background processing with real-time status updates

### System Architecture

- **Frontend**: React + TypeScript + Vite with React Router for navigation
- **Backend**: Node.js + Express with service-oriented architecture
- **Database**: SQLite (development) / PostgreSQL (production)
- **AI Engine**: Anthropic Claude for content extraction and summarization
- **Queue System**: In-memory job queue (development) / Redis (production)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ or 22 LTS
- pnpm (recommended) or npm
- Docker & Docker Compose (for containerized setup)

---

## 🏃 Running Locally (Without Docker)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   
   Create `backend/.env`:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   PORT=3001
   ANTHROPIC_API_KEY=""  # Leave empty for mock mode
   ```

4. **Initialize database**
   ```bash
   pnpm generate  # Generate Prisma Client
   pnpm db:push   # Create database schema
   ```

5. **Start the server**
   ```bash
   pnpm start     # Production mode
   # OR
   pnpm dev       # Development mode with hot-reload
   ```
   
   Backend will be available at `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment** (if needed)
   
   Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```
   
   Frontend will be available at `http://localhost:5173` (or the port Vite assigns)

---

## 🐳 Running with Docker Compose

Docker Compose orchestrates both frontend and backend services with proper networking and environment configuration.

### Quick Start

1. **Ensure you have the backend environment file**
   
   Create `backend/.env` (or `.env.local`):
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   ANTHROPIC_API_KEY=""
   ```

2. **Build and start all services**
   ```bash
   docker compose up --build
   ```

3. **Access the application**
   - Backend API: `http://localhost:3001`
   - Frontend: `http://localhost:5173`

### Docker Compose Commands

```bash
# Start services in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild after code changes
docker compose up --build

# Remove volumes (reset database)
docker compose down -v
```

### Architecture Notes

The Docker setup includes:
- Automatic database initialization on container startup
- Volume mounting for persistent uploads and database
- Health checks for service readiness
- Isolated networking between services

---

## 📚 Detailed Documentation

For in-depth information about each component:

- **Backend Architecture**: See [backend/README.md](backend/README.md)
  - Service-oriented design patterns
  - Asynchronous processing flows
  - Production optimization strategies
  
- **Frontend Architecture**: See [frontend/README.md](frontend/README.md)
  - Component structure and routing
  - State management and data fetching
  - Navigation patterns

---

## 🏗 Project Structure

```
ai-document-vault/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/    # HTTP request handlers
│   │   ├── services/       # Business logic layer
│   │   └── utils/          # Shared utilities
│   ├── prisma/             # Database schema
│   ├── uploads/            # File storage (local)
│   └── Dockerfile
│
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-based pages
│   │   └── services/      # API client
│   └── Dockerfile
│
└── compose.yaml           # Docker orchestration
```

---

## 🔑 Key Features

### Backend Highlights
- **Service Layer Architecture**: Decoupled business logic (StorageService, QueueService, AIService)
- **Asynchronous Processing**: Non-blocking uploads with background AI processing
- **Production-Ready Patterns**: Designed for easy migration to S3, PostgreSQL, and Redis

### Frontend Highlights
- **Progressive Loading**: Metadata-first approach for instant navigation
- **Deep Linking**: Every folder and file has a shareable URL
- **Drag-and-Drop**: Intuitive file upload experience
- **Real-Time Updates**: Status polling for processing documents

---

## 🛠 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | UI framework |
| Build Tool | Vite | Fast development & bundling |
| Routing | React Router | Client-side navigation |
| Backend | Node.js + Express | API server |
| Database | Prisma + SQLite | ORM & data persistence |
| AI | Anthropic Claude | Content analysis & summarization |
| Container | Docker + Compose | Deployment & orchestration |

---

## 🔮 Roadmap to Production

Current prototype focuses on core architecture. Production enhancements include:

- [ ] Authentication & authorization (JWT/OAuth)
- [ ] Pagination for large document collections
- [ ] AWS S3 integration for file storage
- [ ] PostgreSQL for scalable database
- [ ] Redis-backed job queue (BullMQ)
- [ ] Rate limiting & input validation
- [ ] Comprehensive error handling
- [ ] Delete operations with transactional cleanup

See [backend/README.md](backend/README.md) for detailed production strategies.

---

## 📝 License

MIT
