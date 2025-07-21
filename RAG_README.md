# RAG (Retrieval-Augmented Generation) Backend

This implementation provides a complete RAG backend for the AI chatbot, enabling intelligent document search and question answering based on your own documents.

## 🏗️ Architecture Overview

```
Document Sources → Ingestion Pipeline → Vector Store → RAG API → AI Chat
     ↓                    ↓                ↓            ↓         ↓
- PDFs, DOCX         - LangChain      - FAISS       - Retrieval  - Gemini
- Web pages          - Text Chunking  - Embeddings  - Context    - Responses
- Notion pages       - Metadata       - Search      - Generation - Citations
- Google Docs        - Preprocessing                              
- Plain text
```

## 📁 Directory Structure

```
lib/
├── embeddings/          # Gemini embeddings integration
│   └── embedText.ts
├── ingestion/          # Document loading and processing
│   ├── documentLoader.ts
│   ├── notionLoader.ts
│   ├── gdocsLoader.ts
│   └── pipeline.ts
├── rag/               # RAG core functionality
│   ├── chunkDocs.ts
│   ├── retrieveChunks.ts
│   └── buildContext.ts
└── llm/               # LLM integration
    ├── callGemini.ts
    └── buildPrompt.ts

vector-store/          # Vector database management
├── types.ts
├── client.ts
└── index.ts

app/(chat)/api/        # API endpoints
├── ask/route.ts       # Main RAG query endpoint
└── ingest/route.ts    # Document ingestion endpoint

scripts/
└── ingest.ts          # CLI tool for document ingestion
```

## 🚀 Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (for specific document sources)
NOTION_INTEGRATION_TOKEN=your_notion_token
GOOGLE_DRIVE_API_KEY=your_google_drive_key
VECTOR_STORE_PATH=./vector-store/faiss-index
```

### 2. Install Dependencies

The required packages are already added to package.json:
- `langchain` - Document processing framework
- `@langchain/community` - Community loaders
- `@langchain/google-genai` - Gemini integration
- `@langchain/textsplitters` - Text chunking
- `@google/generative-ai` - Gemini API client
- `faiss-node` - Vector similarity search

### 3. Ingest Documents

Using the CLI tool:

```bash
# Ingest PDF and text files
npx tsx scripts/ingest.ts --files "docs/manual.pdf" "docs/guide.txt"

# Ingest entire directory
npx tsx scripts/ingest.ts --directory "docs" --section-aware

# Ingest web pages
npx tsx scripts/ingest.ts --urls "https://example.com/help" "https://docs.example.com"

# Ingest Notion pages
npx tsx scripts/ingest.ts --notion-pages "notion-page-id-1" "notion-page-id-2"

# Ingest Google Docs (public)
npx tsx scripts/ingest.ts --gdocs "https://docs.google.com/document/d/doc-id/edit"

# Ingest plain text
npx tsx scripts/ingest.ts --text "Important information to index"
```

Using the API:

```bash
curl -X POST http://localhost:3000/api/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "sources": [
      {
        "type": "file",
        "path": "/path/to/document.pdf",
        "metadata": {"category": "manual"}
      }
    ],
    "config": {
      "chunkSize": 1000,
      "chunkOverlap": 200,
      "enableSectionAware": true
    }
  }'
```

### 4. Query Documents

Using the API:

```bash
curl -X POST http://localhost:3000/api/ask \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "How do I configure the system?",
    "options": {
      "k": 5,
      "includeSourceCitation": true,
      "responseStyle": "detailed"
    }
  }'
```

## 🔧 Configuration Options

### Ingestion Configuration

```typescript
interface IngestionConfig {
  chunkSize?: number;        // Default: 1000 characters
  chunkOverlap?: number;     // Default: 200 characters
  batchSize?: number;        // Default: 100 chunks per batch
  enableSectionAware?: boolean; // Default: false
}
```

### Query Options

```typescript
interface QueryOptions {
  k?: number;                    // Number of chunks to retrieve (default: 5)
  includeSourceCitation?: boolean; // Include source citations (default: true)
  responseStyle?: 'concise' | 'detailed' | 'conversational'; // Response style
  filterBySource?: string[];     // Filter by specific sources
  stream?: boolean;              // Enable streaming response
}
```

## 📚 Supported Document Types

### File Types
- **PDF** - Extracted using LangChain PDF loader
- **DOCX** - Microsoft Word documents
- **TXT/MD** - Plain text and Markdown files
- **Web Pages** - HTML content extraction

### External Sources
- **Notion** - Pages and databases (requires integration token)
- **Google Docs** - Public documents or with API access
- **URLs** - Web pages with automatic content extraction

## 🧠 RAG Pipeline Details

### 1. Document Ingestion
1. **Loading** - Documents loaded using appropriate LangChain loaders
2. **Cleaning** - Text preprocessing and normalization
3. **Chunking** - Smart text splitting with overlap
4. **Embedding** - Generate embeddings using Gemini
5. **Storage** - Store in FAISS vector database

### 2. Query Processing
1. **Question Analysis** - Determine question type and intent
2. **Retrieval** - Find relevant document chunks
3. **Reranking** - Improve relevance with hybrid scoring
4. **Context Building** - Format context for the LLM
5. **Generation** - Generate response with Gemini
6. **Citation** - Add source references

### 3. Advanced Features

#### Section-Aware Chunking
Automatically detects document sections (headers, etc.) for better context preservation:

```bash
npx tsx scripts/ingest.ts --directory "docs" --section-aware
```

#### Hybrid Search
Combines vector similarity with keyword matching:

```typescript
const retriever = new DocumentRetriever();
const results = await retriever.hybridSearch(query, options);
```

#### Conversation History
Maintains context across multiple turns:

```javascript
const response = await fetch('/api/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "Tell me more about that",
    conversationHistory: [
      { role: 'user', content: 'What is machine learning?' },
      { role: 'assistant', content: 'Machine learning is...' }
    ]
  })
});
```

#### Streaming Responses
Enable real-time response streaming:

```javascript
const response = await fetch('/api/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "Explain the concept",
    options: { stream: true }
  })
});

const reader = response.body.getReader();
// Process streaming chunks...
```

## 🔍 API Endpoints

### POST /api/ask
Main RAG query endpoint

**Request:**
```json
{
  "question": "Your question here",
  "options": {
    "k": 5,
    "includeSourceCitation": true,
    "responseStyle": "detailed",
    "filterBySource": ["manual.pdf"],
    "stream": false
  },
  "conversationHistory": []
}
```

**Response:**
```json
{
  "answer": "Generated response with citations [Source: manual.pdf]",
  "sources": ["manual.pdf", "guide.txt"],
  "chunks": 5,
  "confidence": 0.85
}
```

### POST /api/ingest
Document ingestion endpoint

**Request:**
```json
{
  "sources": [
    {
      "type": "file",
      "path": "/path/to/document.pdf",
      "metadata": {"category": "documentation"}
    }
  ],
  "config": {
    "chunkSize": 1000,
    "enableSectionAware": true
  }
}
```

### GET /api/ask
Health check and statistics

### GET /api/ingest
Ingestion status and configuration

## 🛠️ Development

### Adding New Document Loaders

1. Create a new loader in `lib/ingestion/`:

```typescript
export class CustomLoader {
  async loadDocument(source: string): Promise<Document[]> {
    // Implementation
  }
}
```

2. Add to the ingestion pipeline in `pipeline.ts`

### Customizing Chunking Strategy

Extend the `DocumentChunker` class:

```typescript
class CustomChunker extends DocumentChunker {
  async customChunkStrategy(documents: Document[]): Promise<DocumentChunk[]> {
    // Custom chunking logic
  }
}
```

### Adding New Vector Stores

Implement the `VectorStore` interface:

```typescript
class QdrantVectorStore implements VectorStore {
  // Implement interface methods
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"Vector store not available"**
   - Ensure documents have been ingested first
   - Check GEMINI_API_KEY is set correctly

2. **"Failed to generate embeddings"**
   - Verify Gemini API key and quota
   - Check network connectivity

3. **"No documents loaded"**
   - Verify file paths are correct
   - Check file permissions
   - Ensure supported file formats

4. **High memory usage**
   - Reduce batch size in ingestion config
   - Use smaller chunk sizes
   - Process documents in smaller batches

### Performance Optimization

1. **Indexing Performance**
   - Use larger batch sizes for bulk ingestion
   - Enable section-aware chunking for better context
   - Pre-clean documents before ingestion

2. **Query Performance**
   - Adjust `k` parameter based on needs
   - Use source filtering for targeted searches
   - Cache frequent queries

3. **Memory Management**
   - Monitor vector store size
   - Implement periodic cleanup
   - Use appropriate chunk sizes

## 📈 Monitoring and Analytics

The system provides built-in monitoring through:

- **Ingestion Stats** - Track document processing metrics
- **Query Performance** - Monitor response times and relevance
- **Confidence Scores** - Measure answer quality
- **Source Attribution** - Track document usage

## 🔒 Security Considerations

- Store API keys securely in environment variables
- Validate all input parameters
- Implement rate limiting for production
- Consider access controls for sensitive documents
- Regular security updates for dependencies

## 🚀 Production Deployment

For production use:

1. **Vector Store** - Consider Qdrant or Pinecone for scalability
2. **Caching** - Implement Redis for query caching
3. **Monitoring** - Add logging and performance monitoring
4. **Security** - Implement authentication and authorization
5. **Scaling** - Consider distributed processing for large document sets

This RAG implementation provides a solid foundation for building intelligent document-based chat systems with proper citations, context awareness, and scalable architecture.
