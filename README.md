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
---

## 🏃 Running Locally (Without Docker)
`docker` setup is giving issues with instantiating the `dev.db` SQLite file.

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
   
   Enter your api key in `backend/.env`:
   ```env
   GEMINI_API_KEY=""  # Put in real key or leave empty to see mock data
   ```

4. **Initialize database**
   ```bash
   pnpm generate  # Generate Prisma Client
   ```

5. **Start the server**
   ```bash
   pnpm start
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

3. **Start the development server**
   ```bash
   pnpm dev
   ```
   
   Frontend will be available at `http://localhost:3000`

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

## 🛠 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | NextJS + TypeScript | UI framework |
| Routing | App Router | Server-Side Rendering |
| Backend | Node.js + Express | API server |
| Database | Prisma + SQLite | ORM & data persistence |
| AI | Gemini | Content analysis & summarization |
| Container | Docker + Compose | DX |

---

## ✨ Further Enhancements

If given more time, I would like to re-factor the Backend Services via Strategy Pattern
so we can swap out LLMs (solving the I don't have `gemini` API key but I have `claude`) and Composite Patterns to use both, saving one as a fallback or potentially using both, comparing outputs, and merging them via some ranking algorithm.

Similar approach can be applied to other services.

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
- [ ] Implement ACL on file resources along with basic AuthN and AuthZ
- [ ] Ability to choose which LLM to use
- [ ] Shareable file links (Deep Linking)
- [ ] Caching routes so navigation becomes seamless
- [ ] Accept more file types, which may require OCR

See [backend/README.md](backend/README.md) for detailed production strategies.

---

## 📝 License

MIT
