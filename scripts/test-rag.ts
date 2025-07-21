/**
 * Simple test script for RAG functionality
 * Run with: npx tsx scripts/test-rag.ts
 */

import { DocumentIngestionPipeline } from '../lib/ingestion/pipeline';
import { DocumentRetriever } from '../lib/rag/retrieveChunks';
import { ContextBuilder } from '../lib/rag/buildContext';
import { PromptBuilder } from '../lib/llm/buildPrompt';
import { getGeminiService } from '../lib/llm/callGemini';
import { initializeVectorStore } from '../vector-store';
import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
config({ path: '.env.local' });

const TEST_DOCUMENTS = [
  {
    text: `
# Company Handbook

## Remote Work Policy
All employees can work remotely up to 3 days per week. Remote work requests must be approved by your manager at least 24 hours in advance.

## Vacation Policy  
All full-time employees receive 15 days of paid vacation per year. Vacation requests must be submitted at least 2 weeks in advance through the HR portal.

## Benefits
- Health insurance with 80% company coverage
- 401k matching up to 4% of salary
- Free lunch on Fridays
- Professional development budget of $2000 per year
    `,
    source: 'company-handbook.md',
  },
  {
    text: `
# Technical Documentation

## System Requirements
- Node.js 18 or higher
- PostgreSQL 14+
- Redis 6+
- Minimum 8GB RAM

## Installation Process
1. Clone the repository
2. Install dependencies with npm install
3. Set up environment variables
4. Run database migrations
5. Start the development server

## API Configuration
The system supports both REST and GraphQL endpoints. Authentication is handled via JWT tokens with a 24-hour expiration.
    `,
    source: 'technical-docs.md',
  },
];

const TEST_QUESTIONS = [
  'How many vacation days do employees get?',
  'What are the system requirements?',
  'What is the remote work policy?',
  'How is authentication handled in the API?',
  'What benefits are available to employees?',
];

async function testRAGPipeline() {
  console.log('🧪 Testing RAG Pipeline...\n');

  try {
    // Check environment
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required. Please set it in .env.local');
    }

    console.log('1️⃣ Ingesting test documents...');
    
    // Ingest test documents
    const pipeline = new DocumentIngestionPipeline({
      chunkSize: 500,
      chunkOverlap: 100,
      batchSize: 10,
    });

    const sources = TEST_DOCUMENTS.map(doc => ({
      type: 'text' as const,
      text: doc.text,
      metadata: { source: doc.source, testDocument: true },
    }));

    await pipeline.ingest(sources);
    console.log('✅ Documents ingested successfully\n');

    // Initialize components
    console.log('2️⃣ Initializing RAG components...');
    await initializeVectorStore();
    
    const retriever = new DocumentRetriever();
    const contextBuilder = new ContextBuilder();
    const geminiService = getGeminiService();
    console.log('✅ Components initialized\n');

    // Test each question
    console.log('3️⃣ Testing questions...\n');
    
    for (let i = 0; i < TEST_QUESTIONS.length; i++) {
      const question = TEST_QUESTIONS[i];
      console.log(`❓ Question ${i + 1}: ${question}`);
      
      try {
        // Retrieve relevant chunks
        const chunks = await retriever.retrieveChunks(question, { k: 3 });
        console.log(`📚 Retrieved ${chunks.length} relevant chunks`);
        
        if (chunks.length === 0) {
          console.log('❌ No relevant chunks found\n');
          continue;
        }

        // Build context
        const context = contextBuilder.buildContext(chunks, {
          includeMetadata: true,
          includeSources: true,
        });

        // Generate prompt
        const prompt = PromptBuilder.buildRAGPrompt(question, context, {
          includeSourceCitation: true,
          responseStyle: 'concise',
        });

        // Generate answer
        const answer = await geminiService.generateText(prompt, {
          temperature: 0.3,
          maxTokens: 500,
        });

        console.log(`💡 Answer: ${answer}`);
        console.log(`📄 Sources: ${context.sources.join(', ')}`);
        console.log(`📊 Confidence: ${chunks.length > 0 ? (chunks[0].score * 100).toFixed(1) : 0}%\n`);
        
      } catch (error) {
        console.error(`❌ Error processing question: ${error}\n`);
      }
    }

    console.log('🎉 RAG pipeline test completed successfully!');
    
    // Display summary statistics
    const stats = await pipeline.getStats();
    console.log('\n📈 System Statistics:');
    console.log(JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('❌ RAG pipeline test failed:');
    console.error(error);
    process.exit(1);
  }
}

// Advanced test function
async function testAdvancedFeatures() {
  console.log('\n🔬 Testing Advanced Features...\n');

  try {
    const retriever = new DocumentRetriever();
    const contextBuilder = new ContextBuilder();

    // Test different retrieval strategies
    console.log('1️⃣ Testing diverse retrieval...');
    const question = 'What policies does the company have?';
    
    const regularChunks = await retriever.retrieveChunks(question, { k: 5 });
    const diverseChunks = await retriever.retrieveDiverseChunks(question, { k: 5 });
    const hybridChunks = await retriever.hybridSearch(question, { k: 5 });

    console.log(`📊 Regular retrieval: ${regularChunks.length} chunks`);
    console.log(`📊 Diverse retrieval: ${diverseChunks.length} chunks`);
    console.log(`📊 Hybrid retrieval: ${hybridChunks.length} chunks`);

    // Test different context building strategies
    console.log('\n2️⃣ Testing context building strategies...');
    
    const defaultContext = contextBuilder.buildContext(diverseChunks);
    const sourceGroupedContext = contextBuilder.buildContext(diverseChunks, {
      separateBySource: true,
    });
    const questionSpecificContext = contextBuilder.buildQuestionSpecificContext(
      diverseChunks, 
      question
    );

    console.log(`📄 Default context length: ${defaultContext.totalLength} chars`);
    console.log(`📄 Source-grouped context length: ${sourceGroupedContext.totalLength} chars`);
    console.log(`📄 Question-specific context length: ${questionSpecificContext.totalLength} chars`);

    console.log('\n✅ Advanced features test completed!');

  } catch (error) {
    console.error('❌ Advanced features test failed:');
    console.error(error);
  }
}

// Run tests
async function main() {
  await testRAGPipeline();
  await testAdvancedFeatures();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}
