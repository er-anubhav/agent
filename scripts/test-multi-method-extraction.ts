#!/usr/bin/env node

/**
 * Test script for multi-method PDF extraction
 * This script tests the new OCR + LLM extraction approach
 */

import { DocumentLoader } from '../lib/ingestion/documentLoader';
import path from 'path';
import fs from 'fs/promises';

async function testMultiMethodExtraction() {
  console.log('🧪 Testing Multi-Method PDF Extraction...\n');
  
  const loader = new DocumentLoader();
  
  // Test with a sample PDF file (you can replace this with your actual PDF path)
  const testPdfPath = 'c:\\Users\\ertri\\Desktop\\sample.pdf'; // Replace with your PDF path
  
  try {
    // Check if file exists
    await fs.access(testPdfPath);
    console.log(`📄 Testing with PDF: ${path.basename(testPdfPath)}`);
    
    const startTime = Date.now();
    const docs = await loader.loadFromFile(testPdfPath);
    const endTime = Date.now();
    
    console.log(`\n⏱️  Extraction completed in ${endTime - startTime}ms\n`);
    
    if (docs.length > 0) {
      const doc = docs[0];
      console.log('✅ Extraction Results:');
      console.log(`   📝 Content Length: ${doc.pageContent.length} characters`);
      console.log(`   📊 Word Count: ${doc.pageContent.split(/\s+/).length} words`);
      
      // Check extraction method metadata
      if (doc.metadata.multiMethodExtraction) {
        console.log('   🔀 Method: Multi-method extraction (OCR + LLM)');
        console.log(`   🛠️  Methods Used: ${doc.metadata.extractionMethods?.join(', ')}`);
      } else if (doc.metadata.llm) {
        console.log('   🤖 Method: LLM extraction only');
      } else if (doc.metadata.ocr) {
        console.log('   👁️  Method: OCR extraction only');
      } else {
        console.log('   📖 Method: Standard PDF text extraction');
      }
      
      if (doc.metadata.extractionError) {
        console.log(`   ❌ Error: ${doc.metadata.extractionError}`);
      }
      
      // Show first 200 characters of content
      console.log('\n📄 Content Preview:');
      console.log('   ' + doc.pageContent.substring(0, 200) + '...\n');
      
      console.log('🎉 Test completed successfully!');
    } else {
      console.log('❌ No documents extracted');
    }
    
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`❌ Test file not found: ${testPdfPath}`);
      console.log('\n💡 To test the multi-method extraction:');
      console.log('   1. Place a PDF file at the path above');
      console.log('   2. Or update the testPdfPath variable in this script');
      console.log('   3. Run: npm run test:extraction');
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

async function testWithSamplePDFs() {
  console.log('\n🔍 Looking for sample PDFs in common locations...\n');
  
  const commonPdfLocations = [
    'c:\\Users\\ertri\\Downloads',
    'c:\\Users\\ertri\\Desktop',
    'c:\\Users\\ertri\\Documents'
  ];
  
  const loader = new DocumentLoader();
  
  for (const location of commonPdfLocations) {
    try {
      const files = await fs.readdir(location);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf')).slice(0, 3); // Test first 3 PDFs
      
      if (pdfFiles.length > 0) {
        console.log(`📁 Found PDFs in ${location}:`);
        
        for (const pdfFile of pdfFiles) {
          const pdfPath = path.join(location, pdfFile);
          console.log(`\n   Testing: ${pdfFile}`);
          
          try {
            const startTime = Date.now();
            const docs = await loader.loadFromFile(pdfPath);
            const endTime = Date.now();
            
            if (docs.length > 0) {
              const doc = docs[0];
              console.log(`     ✅ Success (${endTime - startTime}ms)`);
              console.log(`     📝 ${doc.pageContent.length} chars, ${doc.pageContent.split(/\s+/).length} words`);
              
              if (doc.metadata.multiMethodExtraction) {
                console.log('     🔀 Multi-method extraction used');
              } else if (doc.metadata.llm) {
                console.log('     🤖 LLM extraction used');
              } else if (doc.metadata.ocr) {
                console.log('     👁️  OCR extraction used');
              } else {
                console.log('     📖 Standard extraction used');
              }
            } else {
              console.log('     ❌ No content extracted');
            }
          } catch (error: any) {
            console.log(`     ❌ Failed: ${error.message}`);
          }
        }
        
        return; // Stop after finding and testing PDFs in first location
      }
    } catch (error) {
      // Directory doesn't exist or can't be accessed
      continue;
    }
  }
  
  console.log('❌ No PDF files found in common locations');
  console.log('\n💡 To test multi-method extraction:');
  console.log('   1. Place a PDF file in your Downloads, Desktop, or Documents folder');
  console.log('   2. Run this script again');
}

// Main execution
if (require.main === module) {
  testMultiMethodExtraction()
    .then(() => testWithSamplePDFs())
    .catch(console.error);
}

export { testMultiMethodExtraction };
