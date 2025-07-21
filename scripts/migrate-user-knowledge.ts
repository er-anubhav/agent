#!/usr/bin/env node

/**
 * User-Specific Knowledge Base Migration Script
 * 
 * This script migrates from a shared knowledge base to user-specific knowledge bases.
 * It clears the existing vector store to ensure data isolation.
 */

import { existsSync, rmSync, mkdirSync } from 'fs';
import path from 'path';

const VECTOR_STORE_PATH = process.env.VECTOR_STORE_PATH || path.join(process.cwd(), 'vector-store', 'faiss-index');

async function migrateToUserSpecificKnowledgeBase() {
  console.log('🔄 Starting migration to user-specific knowledge base...\n');

  try {
    // Step 1: Clear existing vector store
    console.log('📁 Checking vector store directory...');
    if (existsSync(VECTOR_STORE_PATH)) {
      console.log(`   Found existing vector store at: ${VECTOR_STORE_PATH}`);
      console.log('🗑️  Removing existing vector store data...');
      rmSync(VECTOR_STORE_PATH, { recursive: true, force: true });
      console.log('   ✅ Existing vector store cleared');
    } else {
      console.log('   ✅ No existing vector store found');
    }

    // Step 2: Recreate directory structure
    console.log('📂 Creating fresh vector store directory...');
    mkdirSync(VECTOR_STORE_PATH, { recursive: true });
    console.log('   ✅ Directory structure created');

    // Step 3: Information about the changes
    console.log('\n🔐 Migration Complete! Here\'s what changed:\n');
    
    console.log('✨ NEW FEATURES:');
    console.log('   • User authentication required for RAG queries');
    console.log('   • Documents are now user-specific and private');
    console.log('   • Each user can only access their own uploaded documents');
    console.log('   • Vector store filters results by user ID');
    
    console.log('\n🔒 SECURITY IMPROVEMENTS:');
    console.log('   • All /api/ask requests now require authentication');
    console.log('   • All /api/ingest requests now require authentication');
    console.log('   • User metadata automatically added to all ingested documents');
    console.log('   • Knowledge base isolation prevents cross-user data access');
    
    console.log('\n📋 WHAT TO DO NEXT:');
    console.log('   1. Restart your application server');
    console.log('   2. Users must sign in to access the knowledge base');
    console.log('   3. Re-upload documents (they will be user-specific)');
    console.log('   4. Test RAG queries with user authentication');
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('   • All previously uploaded documents have been cleared');
    console.log('   • Users need to re-ingest their documents');
    console.log('   • Anonymous access to knowledge base is no longer allowed');
    console.log('   • Each user will have their own isolated knowledge base');

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\nPlease check the error above and try again.');
    process.exit(1);
  }
}

// Run the migration
migrateToUserSpecificKnowledgeBase();
