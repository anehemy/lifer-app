/**
 * RAG Knowledge Base for Mr. MG
 * Provides semantic search over knowledge base documents
 */

import fs from 'fs';
import path from 'path';
import { invokeLLM } from './llm';

interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  embedding?: number[];
}

interface SearchResult {
  chunk: KnowledgeChunk;
  score: number;
}

class KnowledgeBase {
  private chunks: KnowledgeChunk[] = [];
  private initialized = false;
  private knowledgeDir = path.join(__dirname, '../knowledge');

  /**
   * Initialize knowledge base by loading and chunking documents
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('[KnowledgeBase] Initializing...');
    
    try {
      // Load all markdown files from knowledge directory
      const files = fs.readdirSync(this.knowledgeDir).filter(f => f.endsWith('.md'));
      
      for (const file of files) {
        const filePath = path.join(this.knowledgeDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Chunk the document
        const fileChunks = this.chunkDocument(content, file);
        this.chunks.push(...fileChunks);
      }
      
      console.log(`[KnowledgeBase] Loaded ${this.chunks.length} chunks from ${files.length} documents`);
      
      // Generate embeddings for all chunks
      await this.generateEmbeddings();
      
      this.initialized = true;
      console.log('[KnowledgeBase] Initialization complete');
    } catch (error) {
      console.error('[KnowledgeBase] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Chunk a document into semantic sections
   */
  private chunkDocument(content: string, source: string): KnowledgeChunk[] {
    const chunks: KnowledgeChunk[] = [];
    
    // Split by major headings (## or ###)
    const sections = content.split(/(?=^#{2,3} )/gm);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;
      
      // If section is too long (>1500 chars), split by paragraphs
      if (section.length > 1500) {
        const paragraphs = section.split(/\n\n+/);
        let currentChunk = '';
        let heading = '';
        
        for (const para of paragraphs) {
          // Extract heading if it's the first paragraph
          if (!heading && para.match(/^#{2,3} /)) {
            heading = para;
            continue;
          }
          
          // If adding this paragraph would exceed limit, save current chunk
          if (currentChunk.length + para.length > 1500 && currentChunk) {
            chunks.push({
              id: `${source}-${chunks.length}`,
              content: heading + '\n\n' + currentChunk,
              source,
            });
            currentChunk = '';
          }
          
          currentChunk += (currentChunk ? '\n\n' : '') + para;
        }
        
        // Add remaining chunk
        if (currentChunk) {
          chunks.push({
            id: `${source}-${chunks.length}`,
            content: heading + '\n\n' + currentChunk,
            source,
          });
        }
      } else {
        // Section is reasonable size, keep as is
        chunks.push({
          id: `${source}-${i}`,
          content: section,
          source,
        });
      }
    }
    
    return chunks;
  }

  /**
   * Generate embeddings for all chunks using Forge API
   */
  private async generateEmbeddings() {
    console.log('[KnowledgeBase] Generating embeddings...');
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < this.chunks.length; i += batchSize) {
      const batch = this.chunks.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (chunk) => {
        try {
          chunk.embedding = await this.getEmbedding(chunk.content);
        } catch (error) {
          console.error(`[KnowledgeBase] Failed to embed chunk ${chunk.id}:`, error);
          // Use zero vector as fallback
          chunk.embedding = new Array(768).fill(0);
        }
      }));
      
      console.log(`[KnowledgeBase] Embedded ${Math.min(i + batchSize, this.chunks.length)}/${this.chunks.length} chunks`);
    }
  }

  /**
   * Get embedding vector for text using Forge API
   */
  private async getEmbedding(text: string): Promise<number[]> {
    try {
      // Use Forge's embedding endpoint
      const ENV = await import('./env').then(m => m.ENV);
      const response = await fetch(`${ENV.forgeApiUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-004',
          input: text,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Embedding API failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('[KnowledgeBase] Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Search knowledge base for relevant chunks
   */
  async search(query: string, topK: number = 3): Promise<SearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Get query embedding
    const queryEmbedding = await this.getEmbedding(query);
    
    // Calculate cosine similarity with all chunks
    const results: SearchResult[] = this.chunks.map(chunk => ({
      chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding!),
    }));
    
    // Sort by score and return top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get relevant context for a conversation
   */
  async getRelevantContext(
    conversationHistory: string,
    userMessage: string,
    maxChunks: number = 2
  ): Promise<string> {
    // Combine recent conversation and current message for context
    const query = `${conversationHistory}\n\nUser: ${userMessage}`;
    
    const results = await this.search(query, maxChunks);
    
    if (results.length === 0) return '';
    
    // Format results as context
    const context = results
      .filter(r => r.score > 0.5) // Only include relevant results
      .map(r => r.chunk.content)
      .join('\n\n---\n\n');
    
    return context ? `\n\n=== Relevant Knowledge ===\n${context}\n` : '';
  }
}

// Singleton instance
export const knowledgeBase = new KnowledgeBase();

