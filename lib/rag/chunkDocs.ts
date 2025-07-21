import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { DocumentChunk } from '../../vector-store/types';
import { nanoid } from 'nanoid';

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
  keepSeparator?: boolean;
}

export class DocumentChunker {
  private splitter: RecursiveCharacterTextSplitter;

  constructor(options: ChunkingOptions = {}) {
    const {
      chunkSize = 1000,
      chunkOverlap = 200,
      separators = ['\n\n', '\n', ' ', ''],
      keepSeparator = true,
    } = options;

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators,
      keepSeparator,
    });
  }

  async chunkDocuments(documents: Document[]): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];

    for (const doc of documents) {
      try {
        const splitDocs = await this.splitter.splitDocuments([doc]);
        
        splitDocs.forEach((splitDoc, index) => {
          const chunk: DocumentChunk = {
            id: nanoid(),
            content: splitDoc.pageContent,
            metadata: {
              ...splitDoc.metadata,
              source: splitDoc.metadata.source || 'unknown',
              chunkIndex: index,
              totalChunks: splitDocs.length,
              originalLength: doc.pageContent.length,
              chunkLength: splitDoc.pageContent.length,
            },
          };
          chunks.push(chunk);
        });

        console.log(`Chunked document ${doc.metadata.source || 'unknown'} into ${splitDocs.length} chunks`);
      } catch (error) {
        console.error(`Failed to chunk document ${doc.metadata.source || 'unknown'}:`, error);
      }
    }

    return chunks;
  }

  async chunkText(text: string, metadata: Record<string, any> = {}): Promise<DocumentChunk[]> {
    const doc = new Document({
      pageContent: text,
      metadata,
    });

    return this.chunkDocuments([doc]);
  }

  // Advanced chunking with section awareness
  async chunkWithSections(documents: Document[]): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];

    for (const doc of documents) {
      try {
        // First, try to split by sections (headers)
        const sections = this.splitIntoSections(doc.pageContent);
        
        for (const section of sections) {
          const sectionDoc = new Document({
            pageContent: section.content,
            metadata: {
              ...doc.metadata,
              section: section.title,
            },
          });

          const sectionChunks = await this.chunkDocuments([sectionDoc]);
          chunks.push(...sectionChunks);
        }

        console.log(`Chunked document ${doc.metadata.source || 'unknown'} into ${chunks.length} section-aware chunks`);
      } catch (error) {
        console.error(`Failed to chunk document with sections ${doc.metadata.source || 'unknown'}:`, error);
        // Fallback to regular chunking
        const fallbackChunks = await this.chunkDocuments([doc]);
        chunks.push(...fallbackChunks);
      }
    }

    return chunks;
  }

  private splitIntoSections(text: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];
    
    // Split by markdown headers or common section patterns
    const headerRegex = /^(#{1,6}\s+.+|[A-Z][^.!?]*:?\s*$)/gm;
    const matches = Array.from(text.matchAll(headerRegex));
    
    if (matches.length === 0) {
      // No clear sections found, return the whole text
      return [{ title: 'Content', content: text }];
    }

    let lastIndex = 0;
    let currentTitle = 'Introduction';

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const sectionStart = match.index || 0;
      
      // Add previous section
      if (sectionStart > lastIndex) {
        const content = text.slice(lastIndex, sectionStart).trim();
        if (content) {
          sections.push({ title: currentTitle, content });
        }
      }
      
      // Update for next section
      currentTitle = match[0].replace(/^#+\s*/, '').replace(/:?\s*$/, '').trim();
      lastIndex = sectionStart + match[0].length;
    }

    // Add final section
    const finalContent = text.slice(lastIndex).trim();
    if (finalContent) {
      sections.push({ title: currentTitle, content: finalContent });
    }

    return sections;
  }

  // Clean and preprocess text before chunking
  cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove empty lines
      .replace(/\n\s*\n/g, '\n')
      // Trim
      .trim();
  }
}
