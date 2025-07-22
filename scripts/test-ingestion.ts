#!/usr/bin/env node

/**
 * Test Document Ingestion with Pinecone
 * 
 * This script tests the document ingestion pipeline with Pinecone.
 */

import { DocumentIngestionPipeline } from '../lib/ingestion/pipeline';
import { getVectorStore } from '../vector-store/index';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables
const envFiles = ['.env.local', '.env'];
for (const envFile of envFiles) {
  const envPath = join(process.cwd(), envFile);
  if (existsSync(envPath)) {
    console.log(`Loading environment from: ${envFile}`);
    dotenv.config({ path: envPath });
    break;
  }
}

async function testDocumentIngestion() {
  console.log('📚 Testing Document Ingestion with Pinecone...\n');

  try {
    // Initialize the ingestion pipeline
    console.log('1. Initializing ingestion pipeline...');
    const pipeline = new DocumentIngestionPipeline({
      chunkSize: 1000,
      chunkOverlap: 200,
      batchSize: 10,
    });
    console.log('✅ Pipeline initialized\n');

    // Test with the AI guide document
    console.log('2. Ingesting test document...');
    const sources = [
      {
        type: 'file' as const,
        path: join(process.cwd(), 'test-documents', 'ai-guide.txt'),
        metadata: {
          title: 'AI and Machine Learning Guide',
          category: 'education',
          uploadedBy: 'test-user',
        }
      }
    ];

    await pipeline.ingest(sources);
    console.log('✅ Document ingested successfully\n');

    // Test vector search
    console.log('3. Testing vector search...');
    const vectorStore = getVectorStore();
    await vectorStore.initialize();
    
    const searchQueries = [
      'What is machine learning?',
      'neural networks deep learning',
      'AI applications examples',
    ];

    for (const query of searchQueries) {
      console.log(`\n🔍 Searching for: "${query}"`);
      const results = await vectorStore.search(query, 3);
      
      if (results.length > 0) {
        console.log(`   Found ${results.length} results:`);
        results.forEach((result, index) => {
          console.log(`   ${index + 1}. Score: ${result.score.toFixed(4)}`);
          console.log(`      Content: ${result.chunk.content.substring(0, 100)}...`);
          console.log(`      Source: ${result.chunk.metadata.source}`);
        });
      } else {
        console.log('   No results found');
      }
    }

    // Get final stats
    console.log('\n4. Getting vector store stats...');
    const stats = await vectorStore.getStats();
    console.log(`✅ Final stats: ${stats.count} vectors, ${stats.dimension} dimensions\n`);

    console.log('🎉 Document ingestion test completed successfully!');
    console.log('Your Pinecone vector database is ready for production use.');
    
  } catch (error) {
    console.error('❌ Ingestion test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('PINECONE_API_KEY')) {
        console.log('\n💡 Make sure your PINECONE_API_KEY is set in .env.local');
      } else if (error.message.includes('ENOENT')) {
        console.log('\n💡 Make sure the test document exists at test-documents/ai-guide.txt');
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testDocumentIngestion()
  .then(() => {
    console.log('\n✨ Ingestion test completed successfully!');
    process.exit(0);
  })
  .catch(console.error);
