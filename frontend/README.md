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

### Smart Routing
- **Route-Based Navigation**: Each folder and file has its own URL using NextJS's built-in routing
- **Browser History Integration**: Navigate forward and backward through your browsing history

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