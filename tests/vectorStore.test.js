import { jest } from '@jest/globals';
import vectorStore from '../src/services/vectorStore.js';
import groqService from '../src/services/groqService.js';

describe('VectorStore', () => {
  beforeAll(async () => {
    await vectorStore.initialize();
  });

  test('should add and search documents', async () => {
    const documents = ['This is a test document', 'Another test document'];
    const embeddings = await groqService.generateEmbeddings(documents);
    
    await vectorStore.addDocuments(documents, embeddings);
    
    const queryEmbedding = await groqService.generateEmbedding('test');
    const results = await vectorStore.search(queryEmbedding, 2);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('content');
    expect(results[0]).toHaveProperty('score');
  });
});