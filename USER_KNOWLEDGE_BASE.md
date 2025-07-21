# User-Specific Knowledge Base Implementation

This document describes the complete implementation of user-specific knowledge bases that ensure data isolation and privacy between users.

## 🔒 What Changed

### Before (Shared Knowledge Base)
- All documents were accessible to all users
- No authentication required for RAG queries
- Single global vector store for all content
- No user data isolation

### After (User-Specific Knowledge Base)
- Each user has their own private knowledge base
- Authentication required for all knowledge operations
- Documents filtered by user ID in vector store
- Complete data isolation between users

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User A        │    │   User B         │    │   User C        │
│   (Authenticated)│    │   (Authenticated)│    │   (Authenticated)│
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          │                      │                       │
    ┌─────▼──────────────────────▼───────────────────────▼─────┐
    │                 RAG API Layer                           │
    │           (Authentication Required)                     │
    └─────────────────────┬───────────────────────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────┐
    │              Vector Store                               │
    │         (User ID Filtering Applied)                     │
    │                                                         │
    │  User A Docs │ User B Docs │ User C Docs │ ...         │
    │  [metadata:  │ [metadata:  │ [metadata:  │             │
    │   uploadedBy │  uploadedBy │  uploadedBy │             │
    │   = userA]   │  = userB]   │  = userC]   │             │
    └─────────────────────────────────────────────────────────┘
```

## 🔧 Implementation Details

### 1. Vector Store Layer (`vector-store/`)

**Enhanced Types:**
```typescript
interface SearchOptions {
  userId?: string;        // NEW: Filter by user
  filterBySource?: string[];
  threshold?: number;
}
```

**Updated Methods:**
- `search(query, k, options)` - Now filters by userId
- `similaritySearch(embedding, k, options)` - Now filters by userId

### 2. RAG Service Layer (`lib/rag/`)

**Enhanced Options:**
```typescript
interface RAGQueryOptions {
  // ... existing options
  userId?: string;       // NEW: User identification
}
```

**Updated Methods:**
- `query()` - Passes userId to retrieval
- `queryStream()` - Passes userId to retrieval  
- `queryWithHistory()` - Passes userId to retrieval

### 3. API Endpoints (`app/api/`)

**Authentication Added:**
- `/api/ask` - Now requires user session
- `/api/ingest` - Now requires user session

**User Metadata:**
- All ingested documents tagged with `uploadedBy: userId`
- Automatic user association during ingestion

### 4. Frontend Components

**New Component:**
- `UserKnowledgeGuard` - Handles authentication UI/UX

**Updated Hooks:**
- `useRAG()` - Better error handling for auth failures
- `useRAGIngestion()` - Better error handling for auth failures

## 🚀 Getting Started

### 1. Run Migration

Clear existing shared data and migrate to user-specific structure:

```bash
npm run rag:migrate
```

### 2. Restart Application

```bash
npm run dev
```

### 3. User Workflow

1. **Sign In**: Users must authenticate first
2. **Upload Documents**: Documents are automatically tagged with user ID
3. **Ask Questions**: Only user's own documents are searched
4. **Privacy**: Complete isolation from other users' data

## 📋 API Changes

### POST /api/ask

**Before:**
```typescript
// No authentication required
const response = await fetch('/api/ask', {
  method: 'POST',
  body: JSON.stringify({ question, options })
});
```

**After:**
```typescript
// Authentication required (automatic via session)
const response = await fetch('/api/ask', {
  method: 'POST',
  body: JSON.stringify({ question, options })
  // userId automatically extracted from session
});

// Returns 401 if not authenticated
```

### POST /api/ingest

**Before:**
```typescript
// No authentication required
const response = await fetch('/api/ingest', {
  method: 'POST',
  body: JSON.stringify({ sources, config })
});
```

**After:**
```typescript
// Authentication required (automatic via session)
const response = await fetch('/api/ingest', {
  method: 'POST',
  body: JSON.stringify({ sources, config })
  // userId automatically added to all document metadata
});

// Returns 401 if not authenticated
```

## 🔐 Security Features

### Data Isolation
- Vector store filtering by `uploadedBy` metadata
- No cross-user data access possible
- Automatic user tagging on ingestion

### Authentication
- Session-based authentication required
- 401 errors for unauthenticated requests
- Clear error messages for better UX

### Privacy
- Each user's documents completely isolated
- No shared knowledge between users
- User-specific retrieval and indexing

## 🧪 Testing User Isolation

### Test Scenario 1: Document Upload
```bash
# User A uploads document
curl -X POST /api/ingest \
  -H "Cookie: authjs.session-token=user-a-token" \
  -d '{"sources": [{"type": "text", "text": "User A secret data"}]}'

# User B uploads document  
curl -X POST /api/ingest \
  -H "Cookie: authjs.session-token=user-b-token" \
  -d '{"sources": [{"type": "text", "text": "User B secret data"}]}'
```

### Test Scenario 2: Knowledge Query
```bash
# User A queries (should only see their data)
curl -X POST /api/ask \
  -H "Cookie: authjs.session-token=user-a-token" \
  -d '{"question": "What secret data do I have?"}'
# Response: Only User A's documents

# User B queries (should only see their data)
curl -X POST /api/ask \
  -H "Cookie: authjs.session-token=user-b-token" \
  -d '{"question": "What secret data do I have?"}'
# Response: Only User B's documents
```

## 🎛️ Configuration

### Environment Variables
```bash
# Existing required variables
GEMINI_API_KEY=your_gemini_api_key

# Optional vector store path
VECTOR_STORE_PATH=./vector-store/faiss-index

# Authentication setup (NextAuth.js)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Database Schema
The existing user authentication tables are used:
- `User` table for user management
- Session management via NextAuth.js
- Document metadata in vector store includes `uploadedBy`

## 🔍 Monitoring & Debugging

### Logs to Watch
```bash
# User-specific ingestion
🔍 Retrieving documents for user abc123: "query text"

# Document filtering
✅ Found 5 documents for user abc123

# Authentication failures
❌ Authentication required. Please sign in to access the knowledge base.
```

### Debugging Commands
```bash
# Check vector store contents
npm run rag:test

# Test user-specific retrieval
npm run rag:test:retrieval

# Verify migration completed
ls -la vector-store/faiss-index/
```

## 🚨 Important Notes

### Data Migration
- **All existing documents are cleared** during migration
- Users must re-upload their documents
- No automatic migration of shared documents to user-specific

### Authentication Requirements
- All RAG operations now require authentication
- Anonymous access is no longer supported
- Clear error messages guide users to sign in

### Performance Considerations
- User filtering happens at vector store level (efficient)
- No performance impact on authenticated queries
- Minimal overhead for user ID checking

## 🛠️ Troubleshooting

### Common Issues

**1. "Authentication required" errors**
- Solution: Ensure user is signed in
- Check session token validity

**2. "No documents found" after migration**
- Solution: Re-upload documents (they were cleared)
- Verify user authentication during upload

**3. Vector store errors**
- Solution: Run migration script again
- Check file permissions on vector store directory

### Development Tips
```bash
# Clear and restart fresh
npm run rag:migrate
npm run dev

# Test with multiple users
# Use different browser sessions/incognito
# Verify document isolation

# Monitor logs
tail -f .next/build.log
```

## 📈 Benefits

✅ **Privacy**: Complete user data isolation  
✅ **Security**: Authentication required for all operations  
✅ **Scalability**: Efficient user-based filtering  
✅ **Maintainability**: Clear separation of concerns  
✅ **User Experience**: Personal knowledge bases  

This implementation provides enterprise-grade privacy and security while maintaining the powerful RAG capabilities of the original system.
