#!/usr/bin/env node

/**
 * Pinecone Setup Script
 * 
 * This script helps you set up a Pinecone index for your vector store.
 * Run this script after setting up your Pinecone API key.
 */

import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables from multiple possible locations
const envFiles = ['.env.local', '.env'];
for (const envFile of envFiles) {
  const envPath = join(process.cwd(), envFile);
  if (existsSync(envPath)) {
    console.log(`Loading environment from: ${envFile}`);
    dotenv.config({ path: envPath });
    break;
  }
}

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'chatbot-vectors';
const DIMENSION = 768; // Gemini text-embedding-004 dimension

async function createPineconeIndex() {
  if (!PINECONE_API_KEY) {
    console.error('❌ PINECONE_API_KEY environment variable is required');
    console.log('\nTo get your API key:');
    console.log('1. Go to https://pinecone.io');
    console.log('2. Sign up for a free account');
    console.log('3. Create a new project');
    console.log('4. Go to API Keys and copy your key');
    console.log('5. Add PINECONE_API_KEY=your_key_here to your .env.local file');
    console.log('\nCurrent environment variables checked:');
    console.log('- PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? '[SET]' : '[NOT SET]');
    console.log('- PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME || '[NOT SET]');
    process.exit(1);
  }

  const pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY,
  });

  try {
    // Check if index already exists
    const existingIndexes = await pinecone.listIndexes();
    const indexExists = existingIndexes.indexes?.some(index => index.name === INDEX_NAME);

    if (indexExists) {
      console.log(`✅ Index "${INDEX_NAME}" already exists`);
      
      // Get index stats
      const index = pinecone.index(INDEX_NAME);
      const stats = await index.describeIndexStats();
      console.log(`📊 Index stats: ${stats.totalRecordCount || 0} vectors`);
      
      return;
    }

    console.log(`🚀 Creating Pinecone index: ${INDEX_NAME}`);
    
    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: DIMENSION,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });

    console.log(`✅ Successfully created index: ${INDEX_NAME}`);
    console.log(`📏 Dimension: ${DIMENSION}`);
    console.log(`📐 Metric: cosine`);
    console.log(`☁️  Type: serverless (AWS us-east-1)`);
    
  } catch (error) {
    console.error('❌ Failed to create Pinecone index:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        console.log(`✅ Index "${INDEX_NAME}" already exists`);
      } else if (error.message.includes('quota')) {
        console.log('\n💡 Note: Free tier allows 1 index. Delete unused indexes at console.pinecone.io');
      } else {
        console.log('\n💡 Troubleshooting:');
        console.log('1. Check your API key is correct');
        console.log('2. Ensure your account is active');
        console.log('3. Check the Pinecone console for any issues');
      }
    }
    
    process.exit(1);
  }
}

// Run the setup
createPineconeIndex()
  .then(() => {
    console.log('\n🎉 Pinecone setup complete!');
    console.log('\nNext steps:');
    console.log('1. Add your documents using the ingestion scripts');
    console.log('2. Test your vector search functionality');
    console.log('3. Deploy to Vercel');
  })
  .catch(console.error);
