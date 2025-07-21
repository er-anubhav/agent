// Test FAISS import
try {
  console.log('Testing faiss-node import...');
  const faiss = require('faiss-node');
  console.log('✅ faiss-node imported successfully');
  
  console.log('Testing @langchain/community import...');
  const { FaissStore } = require('@langchain/community/vectorstores/faiss');
  console.log('✅ FaissStore imported successfully');
  
  console.log('Testing embeddings...');
  const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
  console.log('✅ GoogleGenerativeAIEmbeddings imported successfully');
  
} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Full error:', error);
}
