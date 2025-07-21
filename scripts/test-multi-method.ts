#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { DocumentLoader } from '../lib/ingestion/documentLoader';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

async function testMultiMethodExtraction() {
  console.log('🧪 Testing Multi-Method PDF Extraction...\n');
  
  const loader = new DocumentLoader();
  
  // Find some test PDFs
  const testDir = path.join(process.cwd(), 'tests');
  let files: string[] = [];
  
  try {
    const allFiles = await fs.readdir(testDir, { recursive: true });
    files = allFiles
      .filter(file => typeof file === 'string' && file.toLowerCase().endsWith('.pdf'))
      .map(file => path.join(testDir, file as string))
      .slice(0, 3); // Test with first 3 PDFs found
  } catch (error) {
    console.log('No tests directory found, trying public directory...');
    try {
      const publicDir = path.join(process.cwd(), 'public');
      const allFiles = await fs.readdir(publicDir, { recursive: true });
      files = allFiles
        .filter(file => typeof file === 'string' && file.toLowerCase().endsWith('.pdf'))
        .map(file => path.join(publicDir, file as string))
        .slice(0, 3);
    } catch (err) {
      console.log('No public directory found, trying current directory...');
      try {
        const allFiles = await fs.readdir(process.cwd());
        files = allFiles
          .filter(file => file.toLowerCase().endsWith('.pdf'))
          .map(file => path.join(process.cwd(), file))
          .slice(0, 3);
      } catch (err2) {
        console.log('No PDFs found in current directory');
      }
    }
  }
  
  if (files.length === 0) {
    console.log('⚠️  No PDF files found to test with.');
    console.log('   Create a test by uploading a PDF through the application UI first.');
    return;
  }
  
  console.log(`📁 Found ${files.length} PDF file(s) to test:`);
  files.forEach(file => console.log(`   - ${path.basename(file)}`));
  console.log();
  
  for (const filePath of files) {
    console.log(`🔍 Testing: ${path.basename(filePath)}`);
    
    try {
      // Force multi-method extraction by calling the protected method directly
      const testLoader = new (class extends DocumentLoader {
        async testMultiMethod(file: string) {
          return this.extractPDFWithMultipleMethods(file);
        }
      })();
      
      const extractedContent = await testLoader.testMultiMethod(filePath);
      
      if (extractedContent && extractedContent.trim()) {
        console.log(`✅ Multi-method extraction successful!`);
        console.log(`📄 Content preview (first 200 chars):`);
        console.log(`   "${extractedContent.substring(0, 200)}${extractedContent.length > 200 ? '...' : ''}"`);
        console.log(`📊 Content length: ${extractedContent.length} characters`);
      } else {
        console.log(`❌ Multi-method extraction failed - no content extracted`);
      }
    } catch (error) {
      console.log(`❌ Multi-method extraction failed:`, error instanceof Error ? error.message : String(error));
    }
    
    console.log('─'.repeat(60));
  }
  
  console.log('🎯 Test completed!\n');
  console.log('💡 To see this in action:');
  console.log('   1. Upload a problematic PDF (scanned/image-based) through the UI');
  console.log('   2. Check the document details page for the multi-method badge');
  console.log('   3. The content should show merged results from OCR + Gemini LLM');
}

if (require.main === module) {
  testMultiMethodExtraction().catch(console.error);
}
