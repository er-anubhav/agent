#!/usr/bin/env node

/**
 * Simple Pinecone Test Script
 * 
 * This script tests the basic functionality of the Pinecone vector store.
 */

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

async function testPineconeIntegration() {
  console.log('🧪 Testing Pinecone Integration...\n');

  try {
    // Initialize vector store
    console.log('1. Initializing Pinecone vector store...');
    const vectorStore = getVectorStore();
    await vectorStore.initialize();
    console.log('✅ Vector store initialized successfully\n');

    // Test adding a document
    console.log('2. Adding test document...');
    const testChunks = [
      {
        id: 'test-doc-1',
        content: 'This is a test document about artificial intelligence and machine learning.',
        metadata: {
          source: 'test-document',
          title: 'Test AI Document',
          timestamp: new Date(),
        },
      },
    ];

    await vectorStore.addDocuments(testChunks);
    console.log('✅ Test document added successfully\n');

    // Test search
    console.log('3. Testing vector search...');
    const searchResults = await vectorStore.search('artificial intelligence', 3);
    
    console.log(`✅ Search completed! Found ${searchResults.length} results:`);
    searchResults.forEach((result, index) => {
      console.log(`   ${index + 1}. Score: ${result.score.toFixed(4)} - ${result.chunk.content.substring(0, 80)}...`);
    });
    console.log('');

    // Get stats
    console.log('4. Getting vector store stats...');
    const stats = await vectorStore.getStats();
    console.log(`✅ Stats: ${stats.count} vectors, ${stats.dimension} dimensions\n`);

    console.log('🎉 All tests passed! Pinecone integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('PINECONE_API_KEY')) {
        console.log('\n💡 Make sure your PINECONE_API_KEY is set in .env.local');
      } else if (error.message.includes('index')) {
        console.log('\n💡 Make sure you ran: npm run pinecone:setup');
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testPineconeIntegration()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch(console.error);
