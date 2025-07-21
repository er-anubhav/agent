import { FormattedContext } from '../rag/buildContext';

export interface PromptTemplate {
  system?: string;
  user: string;
  variables?: Record<string, string>;
}

export class PromptBuilder {
  static buildRAGPrompt(
    question: string, 
    context: FormattedContext, 
    options: {
      includeSourceCitation?: boolean;
      responseStyle?: 'concise' | 'detailed' | 'conversational';
      language?: string;
    } = {}
  ): string {
    const {
      includeSourceCitation = true,
      responseStyle = 'detailed',
      language = 'English',
    } = options;

    let systemPrompt = `You are a helpful AI assistant that answers questions based on provided context. `;

    switch (responseStyle) {
      case 'concise':
        systemPrompt += `Provide concise, direct answers. `;
        break;
      case 'detailed':
        systemPrompt += `Provide comprehensive, well-structured answers with relevant details. `;
        break;
      case 'conversational':
        systemPrompt += `Respond in a conversational, friendly tone while being informative. `;
        break;
    }

    if (includeSourceCitation) {
      systemPrompt += `Always cite your sources using the format [Source: filename] when referencing information. `;
    }

    systemPrompt += `Respond in ${language}.

IMPORTANT GUIDELINES:
- Only use information provided in the context below
- If the context doesn't contain enough information to answer the question, say so clearly
- Don't make up or hallucinate information not present in the context
- If multiple sources provide conflicting information, acknowledge this
- Structure your response clearly with appropriate formatting`;

    const userPrompt = `Context Information:
${context.context}

Question: ${question}

Please provide a comprehensive answer based on the context above.`;

    return `${systemPrompt}\n\n${userPrompt}`;
  }

  static buildConversationalRAGPrompt(
    question: string,
    context: FormattedContext,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    options: {
      includeSourceCitation?: boolean;
      maxHistoryLength?: number;
    } = {}
  ): { systemPrompt: string; userPrompt: string; history: string } {
    const { includeSourceCitation = true, maxHistoryLength = 5 } = options;

    const systemPrompt = `You are a helpful AI assistant engaged in a conversation. You answer questions based on provided context and conversation history.

GUIDELINES:
- Use the provided context to answer questions accurately
- Consider the conversation history for continuity
- Cite sources when using information from the context
- If information isn't in the context, clearly state this
- Maintain a conversational tone while being informative
${includeSourceCitation ? '- Use format [Source: filename] for citations' : ''}`;

    // Format conversation history
    const relevantHistory = conversationHistory.slice(-maxHistoryLength);
    const historyText = relevantHistory.length > 0 
      ? `Previous conversation:\n${relevantHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\n`
      : '';

    const userPrompt = `${historyText}Context Information:
${context.context}

Current Question: ${question}

Please respond based on the context and conversation history.`;

    return {
      systemPrompt,
      userPrompt,
      history: historyText,
    };
  }

  static buildSummarizationPrompt(
    text: string,
    options: {
      maxLength?: number;
      style?: 'bullet-points' | 'paragraph' | 'key-points';
      focus?: string;
    } = {}
  ): string {
    const { maxLength = 500, style = 'paragraph', focus } = options;

    let instruction = `Please summarize the following text in approximately ${maxLength} words.`;

    switch (style) {
      case 'bullet-points':
        instruction += ' Use bullet points to organize the key information.';
        break;
      case 'key-points':
        instruction += ' Focus on the main key points and conclusions.';
        break;
      case 'paragraph':
        instruction += ' Write in clear, cohesive paragraphs.';
        break;
    }

    if (focus) {
      instruction += ` Pay special attention to information about: ${focus}.`;
    }

    return `${instruction}

Text to summarize:
${text}

Summary:`;
  }

  static buildQuestionGenerationPrompt(
    context: string,
    options: {
      numQuestions?: number;
      questionTypes?: string[];
      difficulty?: 'easy' | 'medium' | 'hard';
    } = {}
  ): string {
    const { numQuestions = 5, questionTypes = ['factual', 'analytical', 'comparative'], difficulty = 'medium' } = options;

    return `Based on the following context, generate ${numQuestions} ${difficulty} questions that could be answered using this information.

Question types to include: ${questionTypes.join(', ')}

Context:
${context}

Generate diverse, thoughtful questions that would help someone understand the key concepts and details in this content.

Questions:`;
  }

  static buildClassificationPrompt(
    text: string,
    categories: string[],
    options: {
      includeConfidence?: boolean;
      allowMultiple?: boolean;
    } = {}
  ): string {
    const { includeConfidence = false, allowMultiple = false } = options;

    let instruction = `Classify the following text into one${allowMultiple ? ' or more' : ''} of these categories: ${categories.join(', ')}.`;

    if (includeConfidence) {
      instruction += ' Include a confidence score (0-1) for your classification.';
    }

    return `${instruction}

Text to classify:
${text}

Classification:`;
  }

  static buildCustomPrompt(template: PromptTemplate, variables: Record<string, string> = {}): string {
    let prompt = template.user;

    // Replace variables in the template
    const allVariables = { ...template.variables, ...variables };
    Object.entries(allVariables).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    if (template.system) {
      prompt = `${template.system}\n\n${prompt}`;
    }

    return prompt;
  }

  // Helper method to clean and format context for better prompts
  static formatContextForPrompt(context: string, maxLength: number = 4000): string {
    if (context.length <= maxLength) {
      return context;
    }

    // Try to cut at sentence boundaries
    const truncated = context.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    
    if (lastSentence > maxLength * 0.8) {
      return truncated.substring(0, lastSentence + 1) + '\n\n[Content truncated...]';
    } else {
      return truncated + '\n\n[Content truncated...]';
    }
  }
}
