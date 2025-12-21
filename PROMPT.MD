# AI Document Vault - Project Specifications

## Objective

The goal of this project is to design and build a prototype of an AI-powered document management system, which we'll call the **"AI Document Vault"**. The core idea is to create a user-friendly interface for uploading, managing, and interacting with documents, where AI is used to automatically process and enrich the documents with summaries and other structured data.

## Background

In many professional environments, managing a large number of documents (like reports, contracts, articles, etc.) is a common challenge. Finding information quickly and understanding the gist of a document without reading it entirely can save a lot of time. The AI Document Vault aims to solve this by providing a central place to store documents and using AI to make them more accessible and useful.

---

## Requirements

### User Interface (UI)

- A clean and intuitive interface for a document "vault"
- A file and folder explorer view to navigate the uploaded documents
- A mechanism to upload one or more documents, ideally with drag-and-drop support
- A view to display a selected document's content, along with the AI-generated summary and markdown

### Backend

- A simple backend service (e.g., using Node.js/Express, Python/FastAPI, or any other framework you are comfortable with)
- An endpoint to handle file uploads
- The backend should be able to store the files (we recommend you can use the local file system for this prototype or if you prefer use S3 or Supabase Storage)
- It should also store the generated summary and markdown associated with each file - the quality of these markdown and generated summary is **NOT** the core aspect of this case study, and even a first barebones draft version generated with a simple prompt would be sufficient

### AI Integration

- Upon file upload, the backend should call an external AI service (e.g., Anthropic's Claude) to process the document's content
- You will be provided with an API key for this service
- For each uploaded document, you need to generate:
  1. A concise summary of the document
  2. A markdown version of the document that cleans up the structure and formatting
- The original document, its summary, and markdown version should be associated and retrievable

---

## Suggested Technical Stack

- **Frontend**: React, Vue, or Angular
- **Backend**: Node.js (with Express) or Python (with FastAPI)
- **AI Service**: Anthropic Claude API (or a similar large language model)

---

## Deliverables

- The complete source code for both the frontend and backend applications
- A `README.md` file with:
  - Clear instructions on how to set up and run the project
  - A brief explanation of your design choices and architecture
  - Any assumptions you made
- (Optional but recommended) A short video or a few screenshots demonstrating the final application

---

## Evaluation Criteria

You will be evaluated on:

- **Code Quality**: Clarity, organization, and efficiency of your code
- **User Experience (UX)**: The usability and design of your application
- **Problem Solving**: How you approached the requirements and the technical challenges
- **Completeness**: How many of the required features you were able to implement
- **Communication**: The clarity of your documentation and, if applicable, your presentation of the project

---

**Good luck!**