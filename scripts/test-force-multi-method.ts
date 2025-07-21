#!/usr/bin/env node

/**
 * Force multi-method extraction test
 * This script forces the use of multi-method extraction for testing
 */

import { DocumentLoader } from '../lib/ingestion/documentLoader';
import { Document } from '@langchain/core/documents';
import path from 'path';
import fs from 'fs/promises';

class TestDocumentLoader extends DocumentLoader {
  async loadFromFile(filePath: string, metadata?: Record<string, any>): Promise<Document[]> {
    const ext = path.extname(filePath).toLowerCase();
    const source = path.basename(filePath);
    let docs: Document[] = [];
    let extractionError: string | null = null;

    if (ext === '.pdf') {
      console.log(`🔬 Testing multi-method extraction on: ${source}`);
      
      // Force multi-method extraction for testing
      try {
        const extractedContent = await this.extractPDFWithMultipleMethods(filePath);
        if (extractedContent && extractedContent.trim()) {
          docs = [{ 
            pageContent: extractedContent.trim(), 
            metadata: { 
              ...metadata, 
              source, 
              filePath, 
              multiMethodExtraction: true,
              extractionMethods: ['ocr', 'llm']
            } 
          }];
          extractionError = null;
          console.log(`✅ Multi-method extraction successful: ${extractedContent.length} characters`);
        } else {
          extractionError = 'All PDF extraction methods failed.';
          console.log('❌ Multi-method extraction failed');
        }
      } catch (err) {
        extractionError = 'Multi-method PDF extraction failed.';
        console.log(`❌ Multi-method extraction error: ${err}`);
      }
    } else {
      // Use parent implementation for non-PDF files
      return super.loadFromFile(filePath, metadata);
    }

    // Clean text before returning
    docs = docs.map(doc => ({
      ...doc,
      pageContent: doc.pageContent ? doc.pageContent.replace(/\s+/g, ' ').trim() : '',
      metadata: {
        ...doc.metadata,
        source,
        filePath,
        ...metadata,
        extractionError,
      },
    }));
    return docs;
  }
}

async function testForceMultiMethod() {
  console.log('🧪 Testing FORCED Multi-Method PDF Extraction...\n');
  
  const loader = new TestDocumentLoader();
  
  // Look for PDFs in Downloads
  const downloadsPath = 'c:\\Users\\ertri\\Downloads';
  
  try {
    const files = await fs.readdir(downloadsPath);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf')).slice(0, 1); // Test first PDF
    
    if (pdfFiles.length === 0) {
      console.log('❌ No PDF files found in Downloads folder');
      return;
    }
    
    const pdfFile = pdfFiles[0];
    const pdfPath = path.join(downloadsPath, pdfFile);
    
    console.log(`📄 Testing with: ${pdfFile}\n`);
    
    const startTime = Date.now();
    const docs = await loader.loadFromFile(pdfPath);
    const endTime = Date.now();
    
    console.log(`\n⏱️  Total time: ${endTime - startTime}ms\n`);
    
    if (docs.length > 0) {
      const doc = docs[0];
      console.log('📊 Results:');
      console.log(`   Content Length: ${doc.pageContent.length} characters`);
      console.log(`   Word Count: ${doc.pageContent.split(/\s+/).length} words`);
      console.log(`   Multi-Method: ${doc.metadata.multiMethodExtraction ? 'YES' : 'NO'}`);
      console.log(`   Methods Used: ${doc.metadata.extractionMethods?.join(', ') || 'None'}`);
      
      if (doc.metadata.extractionError) {
        console.log(`   Error: ${doc.metadata.extractionError}`);
      }
      
      // Show content preview
      console.log('\n📄 Content Preview:');
      const preview = doc.pageContent.substring(0, 300);
      console.log('   ' + preview + '...\n');
      
      console.log('🎉 Forced multi-method extraction test completed!');
    } else {
      console.log('❌ No documents extracted');
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
}

// Main execution
if (require.main === module) {
  testForceMultiMethod().catch(console.error);
}

export { testForceMultiMethod };
