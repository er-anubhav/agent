import { Document } from '@langchain/core/documents';

export interface GDocsLoaderConfig {
  googleDriveApiKey?: string;
  googleDriveClientId?: string;
  googleDriveClientSecret?: string;
  googleDriveRedirectUri?: string;
  googleDriveAccessToken?: string;
  googleDriveRefreshToken?: string;
}

export class GDocsLoader {
  private config: GDocsLoaderConfig;

  constructor(config: GDocsLoaderConfig) {
    this.config = config;
  }

  async loadDocument(documentId: string, metadata?: Record<string, any>): Promise<Document[]> {
    try {
      // Use Google Docs API to fetch document content
      const apiUrl = `https://docs.googleapis.com/v1/documents/${documentId}?key=${this.config.googleDriveApiKey}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract text content from the document structure
      const content = this.extractTextFromGoogleDoc(data);
      
      return [{
        pageContent: content,
        metadata: {
          source: 'google-docs',
          documentId,
          title: data.title,
          ...metadata,
        },
      }];
    } catch (error) {
      console.error(`Failed to load Google Doc ${documentId}:`, error);
      throw error;
    }
  }

  private extractTextFromGoogleDoc(docData: any): string {
    let text = '';
    
    if (docData.body && docData.body.content) {
      for (const element of docData.body.content) {
        if (element.paragraph) {
          for (const paragraphElement of element.paragraph.elements) {
            if (paragraphElement.textRun) {
              text += paragraphElement.textRun.content;
            }
          }
        }
      }
    }
    
    return text;
  }

  async loadFolder(folderId: string, metadata?: Record<string, any>): Promise<Document[]> {
    try {
      // Use Google Drive API to list files in folder
      const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${this.config.googleDriveApiKey}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch folder contents: ${response.statusText}`);
      }
      
      const data = await response.json();
      const documentIds = data.files.filter((file: any) => 
        file.mimeType === 'application/vnd.google-apps.document'
      ).map((file: any) => file.id);
      
      return this.loadMultipleDocuments(documentIds, metadata);
    } catch (error) {
      console.error(`Failed to load Google Drive folder ${folderId}:`, error);
      throw error;
    }
  }

  async loadMultipleDocuments(documentIds: string[], metadata?: Record<string, any>): Promise<Document[]> {
    const allDocs: Document[] = [];
    
    for (const documentId of documentIds) {
      try {
        const docs = await this.loadDocument(documentId, metadata);
        allDocs.push(...docs);
        console.log(`Loaded ${docs.length} documents from Google Doc ${documentId}`);
      } catch (error) {
        console.error(`Failed to load Google Doc ${documentId}:`, error);
      }
    }
    
    return allDocs;
  }
}

// Alternative simple implementation for Google Docs using public sharing
export class SimpleGDocsLoader {
  async loadPublicDocument(docUrl: string, metadata?: Record<string, any>): Promise<Document[]> {
    try {
      // Extract document ID from URL
      const match = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error('Invalid Google Docs URL');
      }
      
      const documentId = match[1];
      
      // Use export URL to get plain text
      const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`;
      
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      
      const text = await response.text();
      
      return [{
        pageContent: text,
        metadata: {
          source: 'google-docs',
          documentId,
          url: docUrl,
          ...metadata,
        },
      }];
    } catch (error) {
      console.error(`Failed to load public Google Doc ${docUrl}:`, error);
      throw error;
    }
  }
}
