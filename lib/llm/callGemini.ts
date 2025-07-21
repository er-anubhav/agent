import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export class GeminiService {
  private genai: GoogleGenerativeAI;
  private config: GeminiConfig;

  constructor(config: GeminiConfig = {}) {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.config = {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.8,
      topK: 40,
      ...config,
      apiKey,
    };

    this.genai = new GoogleGenerativeAI(this.config.apiKey!);
  }

  async generateText(prompt: string, options: GenerationOptions = {}): Promise<string> {
    try {
      const model = this.genai.getGenerativeModel({ 
        model: this.config.model!,
        generationConfig: {
          temperature: options.temperature ?? this.config.temperature,
          maxOutputTokens: options.maxTokens ?? this.config.maxTokens,
          topP: this.config.topP,
          topK: this.config.topK,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating text with Gemini:', error);
      throw new Error(`Failed to generate text: ${error}`);
    }
  }

  async generateStream(prompt: string, options: GenerationOptions = {}): Promise<ReadableStream<Uint8Array>> {
    try {
      const model = this.genai.getGenerativeModel({ 
        model: this.config.model!,
        generationConfig: {
          temperature: options.temperature ?? this.config.temperature,
          maxOutputTokens: options.maxTokens ?? this.config.maxTokens,
          topP: this.config.topP,
          topK: this.config.topK,
        },
      });

      const result = await model.generateContentStream(prompt);

      return new ReadableStream({
        async start(controller) {
          try {
            const encoder = new TextEncoder();
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              const encoded = encoder.encode(chunkText);
              controller.enqueue(encoded);
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });
    } catch (error) {
      console.error('Error generating streaming text with Gemini:', error);
      throw new Error(`Failed to generate streaming text: ${error}`);
    }
  }

  async generateWithHistory(messages: Array<{ role: 'user' | 'model'; parts: string }>, options: GenerationOptions = {}): Promise<string> {
    try {
      const model = this.genai.getGenerativeModel({ 
        model: this.config.model!,
        generationConfig: {
          temperature: options.temperature ?? this.config.temperature,
          maxOutputTokens: options.maxTokens ?? this.config.maxTokens,
          topP: this.config.topP,
          topK: this.config.topK,
        },
      });

      const chat = model.startChat({
        history: messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.parts }],
        })),
      });

      // Get the last user message to continue the conversation
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (!lastUserMessage) {
        throw new Error('No user message found in history');
      }

      const result = await chat.sendMessage(lastUserMessage.parts);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating text with history:', error);
      throw new Error(`Failed to generate text with history: ${error}`);
    }
  }
}

// Singleton instance
let geminiService: GeminiService | null = null;

export function getGeminiService(config?: GeminiConfig): GeminiService {
  if (!geminiService) {
    geminiService = new GeminiService(config);
  }
  return geminiService;
}
