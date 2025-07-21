import { SearchResult } from '../../vector-store/types';

export interface ContextOptions {
  maxLength?: number;
  includeMetadata?: boolean;
  includeSources?: boolean;
  template?: string;
  separateBySource?: boolean;
}

export interface FormattedContext {
  context: string;
  sources: string[];
  chunks: SearchResult[];
  totalLength: number;
}

export class ContextBuilder {
  buildContext(chunks: SearchResult[], options: ContextOptions = {}): FormattedContext {
    const {
      maxLength = 4000,
      includeMetadata = true,
      includeSources = true,
      template,
      separateBySource = false,
    } = options;

    if (chunks.length === 0) {
      return {
        context: '',
        sources: [],
        chunks: [],
        totalLength: 0,
      };
    }

    let formattedContext: string;
    
    if (template) {
      formattedContext = this.buildWithTemplate(chunks, template, options);
    } else if (separateBySource) {
      formattedContext = this.buildSeparatedBySource(chunks, options);
    } else {
      formattedContext = this.buildDefaultContext(chunks, options);
    }

    // Truncate if too long
    if (formattedContext.length > maxLength) {
      formattedContext = this.truncateContext(formattedContext, maxLength);
    }

    // Extract unique sources
    const sources = Array.from(new Set(
      chunks.map(chunk => chunk.chunk.metadata.source)
    ));

    return {
      context: formattedContext,
      sources,
      chunks,
      totalLength: formattedContext.length,
    };
  }

  private buildDefaultContext(chunks: SearchResult[], options: ContextOptions): string {
    const { includeMetadata = true } = options;
    
    return chunks
      .map((result, index) => {
        let chunkText = `[${index + 1}] ${result.chunk.content}`;
        
        if (includeMetadata) {
          const metadata = result.chunk.metadata;
          const metaParts = [];
          
          if (metadata.source) metaParts.push(`Source: ${metadata.source}`);
          if (metadata.section) metaParts.push(`Section: ${metadata.section}`);
          if (metadata.page) metaParts.push(`Page: ${metadata.page}`);
          
          if (metaParts.length > 0) {
            chunkText += `\n(${metaParts.join(', ')})`;
          }
        }
        
        return chunkText;
      })
      .join('\n\n');
  }

  private buildSeparatedBySource(chunks: SearchResult[], options: ContextOptions): string {
    const { includeMetadata = true } = options;
    
    // Group chunks by source
    const chunksBySource = chunks.reduce((acc, result) => {
      const source = result.chunk.metadata.source;
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);

    return Object.entries(chunksBySource)
      .map(([source, sourceChunks]) => {
        const sourceContent = sourceChunks
          .map((result, index) => {
            let chunkText = `${index + 1}. ${result.chunk.content}`;
            
            if (includeMetadata && result.chunk.metadata.section) {
              chunkText += `\n   (Section: ${result.chunk.metadata.section})`;
            }
            
            return chunkText;
          })
          .join('\n\n');
        
        return `## From ${source}:\n${sourceContent}`;
      })
      .join('\n\n');
  }

  private buildWithTemplate(chunks: SearchResult[], template: string, options: ContextOptions): string {
    const chunksText = this.buildDefaultContext(chunks, options);
    const sources = Array.from(new Set(chunks.map(chunk => chunk.chunk.metadata.source)));
    
    return template
      .replace('{{chunks}}', chunksText)
      .replace('{{sources}}', sources.join(', '))
      .replace('{{numChunks}}', chunks.length.toString());
  }

  private truncateContext(context: string, maxLength: number): string {
    if (context.length <= maxLength) {
      return context;
    }

    // Try to truncate at sentence boundaries
    const truncated = context.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    
    const cutPoint = Math.max(lastSentence, lastNewline);
    
    if (cutPoint > maxLength * 0.8) {
      return truncated.substring(0, cutPoint) + '...';
    } else {
      return truncated + '...';
    }
  }

  // Build context optimized for specific question types
  buildQuestionSpecificContext(chunks: SearchResult[], question: string, options: ContextOptions = {}): FormattedContext {
    // Analyze question type
    const questionType = this.analyzeQuestionType(question);
    
    // Adjust context based on question type
    const adjustedOptions = { ...options };
    
    switch (questionType) {
      case 'factual':
        adjustedOptions.includeMetadata = true;
        adjustedOptions.separateBySource = true;
        break;
      case 'comparative':
        adjustedOptions.separateBySource = true;
        adjustedOptions.template = this.getComparativeTemplate();
        break;
      case 'procedural':
        adjustedOptions.template = this.getProceduralTemplate();
        break;
      default:
        // Use default settings
        break;
    }
    
    return this.buildContext(chunks, adjustedOptions);
  }

  private analyzeQuestionType(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('how to') || lowerQuestion.includes('steps') || lowerQuestion.includes('process')) {
      return 'procedural';
    } else if (lowerQuestion.includes('vs') || lowerQuestion.includes('compared to') || lowerQuestion.includes('difference')) {
      return 'comparative';
    } else if (lowerQuestion.startsWith('what') || lowerQuestion.startsWith('who') || lowerQuestion.startsWith('when')) {
      return 'factual';
    } else {
      return 'general';
    }
  }

  private getComparativeTemplate(): string {
    return `Based on the following information sources:

{{chunks}}

Sources: {{sources}}

Please compare the relevant information to answer the question.`;
  }

  private getProceduralTemplate(): string {
    return `Step-by-step information from {{numChunks}} sources:

{{chunks}}

Sources: {{sources}}

Please provide a clear procedure based on this information.`;
  }
}
