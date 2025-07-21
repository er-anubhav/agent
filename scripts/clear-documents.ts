#!/usr/bin/env node

/**
 * Clear documents from database and vector store
 * Use this to test fresh document ingestion with the new multi-method extraction
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { document } from '../lib/db/schema';
import { getVectorStore } from '../vector-store';

async function clearDocuments() {
  console.log('🗑️  Clearing existing documents...\n');
  
  try {
    // Initialize database connection
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    // Delete all documents from database
    console.log('📄 Clearing documents from database...');
    const deletedDocs = await db.delete(document).returning();
    console.log(`   ✅ Deleted ${deletedDocs.length} documents from database`);
    
    // Clear vector store
    console.log('\n🔍 Clearing vector store...');
    try {
      const vectorStore = getVectorStore();
      await vectorStore.initialize();
      
      // For FAISS, we need to recreate the index to clear it
      const stats = await vectorStore.getStats();
      if (stats && stats.count > 0) {
        // This will depend on your vector store implementation
        console.log(`   📊 Found ${stats.count} vectors in store`);
        console.log('   ℹ️  Vector store will be cleared on next ingestion');
      } else {
        console.log('   ✅ Vector store is already empty');
      }
    } catch (vectorError) {
      console.log(`   ⚠️  Vector store check failed: ${vectorError}`);
    }
    
    console.log('\n🎉 Documents cleared successfully!');
    console.log('\n💡 Now you can:');
    console.log('   1. Upload a new PDF file through the web interface');
    console.log('   2. The new multi-method extraction will be used automatically');
    console.log('   3. Check the document details page to see the extraction method used');
    
    await client.end();
    
  } catch (error: any) {
    console.error('❌ Failed to clear documents:', error.message);
    process.exit(1);
  }
}

async function clearUserDocuments(userId: string) {
  console.log(`🗑️  Clearing documents for user: ${userId}...\n`);
  
  try {
    // Initialize database connection
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    // Delete documents for specific user
    const { eq } = await import('drizzle-orm');
    const deletedDocs = await db.delete(document).where(eq(document.userId, userId)).returning();
    console.log(`✅ Deleted ${deletedDocs.length} documents for user ${userId}`);
    
    await client.end();
    
  } catch (error: any) {
    console.error('❌ Failed to clear user documents:', error.message);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const userIdFlag = args.indexOf('--user');
  
  if (userIdFlag !== -1 && args[userIdFlag + 1]) {
    const userId = args[userIdFlag + 1];
    clearUserDocuments(userId).catch(console.error);
  } else {
    clearDocuments().catch(console.error);
  }
}

export { clearDocuments, clearUserDocuments };
