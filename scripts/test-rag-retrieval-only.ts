/**
 * RAG Retrieval Test (without LLM generation to avoid quota limits)
 * Run with: npx tsx scripts/test-rag-retrieval-only.ts
 */

import { DocumentIngestionPipeline } from '../lib/ingestion/pipeline';
import { DocumentRetriever } from '../lib/rag/retrieveChunks';
import { ContextBuilder } from '../lib/rag/buildContext';
import { PromptBuilder } from '../lib/llm/buildPrompt';
import { initializeVectorStore } from '../vector-store';
import { config } from 'dotenv';

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

async function testRAGRetrieval() {
  console.log('🧪 Testing RAG Retrieval System (No LLM Generation)...\n');

  try {
    // Check environment (embeddings only)
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
    console.log('✅ Components initialized\n');

    // Test each question
    console.log('3️⃣ Testing retrieval for each question...\n');
    
    for (let i = 0; i < TEST_QUESTIONS.length; i++) {
      const question = TEST_QUESTIONS[i];
      console.log(`❓ Question ${i + 1}: ${question}`);
      
      try {
        // Test regular retrieval
        const chunks = await retriever.retrieveChunks(question, { k: 3 });
        console.log(`📚 Retrieved ${chunks.length} relevant chunks`);
        
        if (chunks.length === 0) {
          console.log('❌ No relevant chunks found\n');
          continue;
        }

        // Show chunk details
        chunks.forEach((chunk, idx) => {
          console.log(`   📄 Chunk ${idx + 1}: Score ${(chunk.score * 100).toFixed(1)}% | Source: ${chunk.chunk.metadata.source}`);
          console.log(`      Preview: "${chunk.chunk.content.substring(0, 100)}..."`);
        });

        // Build context (this would be passed to LLM)
        const context = contextBuilder.buildContext(chunks, {
          includeMetadata: true,
          includeSources: true,
        });

        // Generate prompt (this would be sent to LLM)
        const prompt = PromptBuilder.buildRAGPrompt(question, context, {
          includeSourceCitation: true,
          responseStyle: 'concise',
        });

        console.log(`📝 Generated prompt length: ${prompt.length} characters`);
        console.log(`📄 Context sources: ${context.sources.join(', ')}`);
        console.log(`✅ RAG retrieval successful for this question\n`);
        
      } catch (error) {
        console.error(`❌ Error processing question: ${error}\n`);
      }
    }

    console.log('🎉 RAG retrieval test completed successfully!');
    
    // Display summary statistics
    const stats = await pipeline.getStats();
    console.log('\n📈 System Statistics:');
    console.log(JSON.stringify(stats, null, 2));

    // Test advanced features
    await testAdvancedRetrievalFeatures(retriever, contextBuilder);

  } catch (error) {
    console.error('❌ RAG retrieval test failed:');
    console.error(error);
    process.exit(1);
  }
}

async function testAdvancedRetrievalFeatures(retriever: DocumentRetriever, contextBuilder: ContextBuilder) {
  console.log('\n🔬 Testing Advanced Retrieval Features...\n');

  try {
    // Test different retrieval strategies
    console.log('1️⃣ Testing different retrieval strategies...');
    const question = 'What policies does the company have?';
    
    const regularChunks = await retriever.retrieveChunks(question, { k: 5 });
    const diverseChunks = await retriever.retrieveDiverseChunks(question, { k: 5 });
    const hybridChunks = await retriever.hybridSearch(question, { k: 5 });

    console.log(`📊 Regular retrieval: ${regularChunks.length} chunks`);
    console.log(`📊 Diverse retrieval: ${diverseChunks.length} chunks`);
    console.log(`📊 Hybrid retrieval: ${hybridChunks.length} chunks`);

    // Show score distributions
    console.log('\n📈 Score Analysis:');
    console.log('Regular scores:', regularChunks.map(c => (c.score * 100).toFixed(1)).join(', '));
    console.log('Diverse scores:', diverseChunks.map(c => (c.score * 100).toFixed(1)).join(', '));
    console.log('Hybrid scores:', hybridChunks.map(c => (c.score * 100).toFixed(1)).join(', '));

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

    console.log(`📄 Default context: ${defaultContext.totalLength} chars, ${defaultContext.sources.length} sources`);
    console.log(`📄 Source-grouped context: ${sourceGroupedContext.totalLength} chars, ${sourceGroupedContext.sources.length} sources`);
    console.log(`📄 Question-specific context: ${questionSpecificContext.totalLength} chars, ${questionSpecificContext.sources.length} sources`);

    // Test context quality
    console.log('\n3️⃣ Context Quality Analysis...');
    console.log('Default context preview:');
    console.log(defaultContext.context.substring(0, 200) + '...\n');

    console.log('Source-grouped context preview:');
    console.log(sourceGroupedContext.context.substring(0, 200) + '...\n');

    console.log('✅ Advanced retrieval features test completed!');

  } catch (error) {
    console.error('❌ Advanced retrieval features test failed:');
    console.error(error);
  }
}

// Expected answers for manual verification
function displayExpectedAnswers() {
  console.log('\n🎯 Expected Answers for Manual Verification:\n');
  
  const expectedAnswers = [
    {
      question: 'How many vacation days do employees get?',
      answer: '15 days of paid vacation per year for full-time employees',
      source: 'company-handbook.md'
    },
    {
      question: 'What are the system requirements?',
      answer: 'Node.js 18+, PostgreSQL 14+, Redis 6+, minimum 8GB RAM',
      source: 'technical-docs.md'
    },
    {
      question: 'What is the remote work policy?',
      answer: 'Employees can work remotely up to 3 days per week with manager approval 24 hours in advance',
      source: 'company-handbook.md'
    },
    {
      question: 'How is authentication handled in the API?',
      answer: 'Via JWT tokens with 24-hour expiration',
      source: 'technical-docs.md'
    },
    {
      question: 'What benefits are available to employees?',
      answer: 'Health insurance (80% coverage), 401k matching (4%), free Friday lunch, $2000 professional development budget',
      source: 'company-handbook.md'
    }
  ];

  expectedAnswers.forEach((item, idx) => {
    console.log(`${idx + 1}. Q: ${item.question}`);
    console.log(`   A: ${item.answer}`);
    console.log(`   Source: ${item.source}\n`);
  });

  console.log('✅ Compare these expected answers with your retrieved chunks to verify accuracy!');
}

// Run tests
async function main() {
  await testRAGRetrieval();
  displayExpectedAnswers();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}
