# Error Handling Implementation

## Overview
Comprehensive error handling has been implemented across all backend services to ensure:
- Separation of internal errors from client-facing messages
- Appropriate logging at correct levels
- Consistent error responses
- Enhanced debugging capabilities

## Custom Error Classes

Located in `backend/src/shared/errors.ts`:

### AppError (Base Class)
- `statusCode`: HTTP status code
- `isOperational`: Distinguishes operational vs programmer errors
- All custom errors extend this class

### Error Types
1. **NotFoundError** (404) - Resource not found
2. **ValidationError** (400) - Invalid input data
3. **DatabaseError** (500) - Database operation failures
4. **FileSystemError** (500) - File system operation failures
5. **AIServiceError** (500) - AI service failures
6. **UnauthorizedError** (401) - Authentication required
7. **ForbiddenError** (403) - Insufficient permissions

## Service-Level Error Handling

### DocumentController
- All methods wrapped in try-catch blocks
- Logs at appropriate levels:
  - `INFO`: Request received, successful operations
  - `WARN`: Resource not found
  - `ERROR`: Operation failures
  - `DEBUG`: Detailed context (IDs, filenames)
- Throws custom errors (NotFoundError, ValidationError)
- Passes errors to next() for global handler

### MetadataService
- Database operations wrapped with error handling
- Validates input parameters (documentId, folderId required)
- Logs database operations with context
- Throws DatabaseError for Prisma failures
- Breadcrumb generation with graceful degradation

### AIService
- File extraction with existence validation
- PDF parsing with text fallback
- Mock mode detection and logging
- AI API response validation
- Throws AIServiceError for API failures
- Throws FileSystemError for file access issues
- Zod validation errors caught and logged

### StorageService
- Upload directory initialization with error handling
- Path traversal protection in getPhysicalPath()
- Validates filenames before resolution
- Throws FileSystemError for invalid paths
- Security logging for suspicious activity

### QueueService
- Background job processing with comprehensive logging
- Graceful failure handling
- Status updates on failures
- Unhandled promise rejection catching
- Detailed logging at each processing stage:
  - Job queued
  - Metadata retrieved
  - Status changes
  - Text extraction
  - AI processing
  - Results saved
  - Completion/failure

## Global Error Middleware

Located in `backend/src/server.ts`:

### AppError Handling
- Logs full context (path, method, statusCode, stack)
- Returns clean JSON response:
  ```json
  {
    "error": {
      "message": "Resource not found",
      "statusCode": 404
    }
  }
  ```

### Unexpected Errors
- Logs full error details internally
- Returns generic message to client:
  ```json
  {
    "error": {
      "message": "Internal server error",
      "statusCode": 500
    }
  }
  ```

## Logging Levels

- **DEBUG** (0): Detailed information (DB queries, file paths, IDs)
- **INFO** (1): Important operations (requests, completions)
- **WARN** (2): Recoverable issues (not found, missing data)
- **ERROR** (3): Failures requiring attention

### Environment Configuration
- **Development**: DEBUG level (all logs)
- **Production**: INFO level (important events only)

## Error Flow Example

1. **Request arrives** → Controller logs info
2. **Validation fails** → Throw ValidationError
3. **Database query fails** → Throw DatabaseError  
4. **Error caught** → Log error with context
5. **Error passed to next()** → Global middleware
6. **Global handler** → Log full details, send sanitized response
7. **Client receives** → Clean error message (no stack traces)

## Security Considerations

1. **Path Traversal Protection**: StorageService validates all file paths
2. **Error Message Sanitization**: Stack traces never sent to clients
3. **Operational vs Programming Errors**: Only operational errors expose details
4. **Suspicious Activity Logging**: Path traversal attempts logged as errors

## Testing Recommendations

1. **Not Found Cases**: Test 404 responses for missing resources
2. **Invalid Input**: Test 400 responses for validation failures
3. **File System Errors**: Test file not found, permission issues
4. **Database Failures**: Test with invalid IDs, constraint violations
5. **AI Service Failures**: Test with no API key (mock mode), invalid responses
6. **Background Jobs**: Test job processing failures and status updates

## Maintenance

- All console.log/console.error replaced with logger calls
- Consistent error throwing patterns across services
- Error classes easily extensible for new error types
- Centralized error handling logic in middleware
