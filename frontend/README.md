# AI Document Vault - Frontend

A modern file viewing portal and dashboard for browsing and viewing documents with AI-powered summaries.

## Overview

This frontend application provides an intuitive interface for navigating through a hierarchical document structure and viewing files with AI-generated insights.

## Features

### Document Upload
- **Drag-and-Drop Interface**: Easily upload files by dragging them into the application
- **Manual Upload**: Traditional file selection for uploading documents
- **Seamless Integration**: Uploaded files are automatically processed in the background

### Tree-Based Navigation
- **Hierarchical Folder Structure**: Browse documents organized in a tree-like folder hierarchy
- **Efficeint Loading**: Fetches only metadata on initial load for optimal performance, click on specific file to view its content side-by-side AI summary and Markdown view.
- **Progressive Discovery**: Folder contents are loaded on-demand as you navigate

### Smart Routing and Breadcrumbs
- **Route-Based Navigation**: Each folder and file has its own URL using NextJS's built-in routing
- **Browser History Integration**: Navigate forward and backward through your browsing history
- **Dynamic Breadcrumb Trail**: Visual path showing your current location in the folder hierarchy

### File Viewing
- **Metadata Display**: View file information before downloading content
- **AI-Generated Summaries**: Get instant insights about document contents powered by AI
- **Markdown Preview**: View files rendered as markdown for better readability

## Architecture

### Navigation Flow
1. **Initial Load**: Fetches top-level folder structure (metadata only)
2. **Folder Navigation**: Clicking a folder appends to router history and loads subtree metadata
3. **File Selection**: Clicking a file changes the route and fetches full file contents, summary, and markdown view

### Technology Stack
- NextJS with App Router for out-of-the-box SSR
- Modern ESM-based architecture

## Breadcrumb Management

The application implements a sophisticated breadcrumb system that provides users with clear navigational context and efficient folder hierarchy traversal.

### Architecture Overview

The breadcrumb system follows a backend-driven approach where breadcrumb data is computed on the server and consumed by the frontend. This ensures consistency and reduces client-side complexity.

#### Backend Integration
1. **API Response**: When fetching a folder via `GET /api/folders/:folderId`, the backend returns a `breadcrumbs` array containing the complete path from root to the current folder
2. **Breadcrumb Structure**: Each breadcrumb object contains:
   ```typescript
   {
     id: string;      // Unique folder identifier
     name: string;    // Display name of the folder
   }
   ```
3. **Hierarchical Calculation**: The backend traverses the folder hierarchy upwards to build the complete breadcrumb trail

#### Frontend Implementation

**For Folder Views:**
- Breadcrumbs are directly received from the folder API response
- Each breadcrumb item (except the last) is rendered as a clickable link
- Clicking a breadcrumb navigates to that folder: `/dashboard/folder/{folderId}`
- The last folder in the trail is displayed in bold as the current location

**For Document Views:**
- When viewing a document, the system fetches the parent folder's metadata to obtain breadcrumbs
- The document's `folderId` field identifies the parent folder
- After retrieving folder breadcrumbs, the document's filename is appended as a final, non-clickable breadcrumb
- This creates a complete path: `My Documents / Folder1 / Subfolder / document.pdf`

### User Experience Benefits

1. **Context Awareness**: Users always know their location within the folder hierarchy
2. **Quick Navigation**: Click any folder in the path to jump directly to that level
3. **Consistent Patterns**: Same breadcrumb behavior across folder and document views
4. **Browser History**: Breadcrumb navigation integrates with browser back/forward buttons

### Technical Considerations

- **No Client-Side Parsing**: Breadcrumbs are pre-calculated by the backend, eliminating the need for URL slug parsing on the client
- **Single Source of Truth**: The folder hierarchy in the database drives breadcrumb generation
- **Performance**: Breadcrumb data is included in the initial folder fetch, requiring no additional API calls (except for document views)
- **Type Safety**: TypeScript interfaces ensure breadcrumb data structure consistency between frontend and backend