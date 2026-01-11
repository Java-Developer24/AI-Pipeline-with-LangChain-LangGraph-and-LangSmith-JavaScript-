import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

class VectorStoreService {
  constructor() {
    this.client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY
});

    this.collectionName = process.env.QDRANT_COLLECTION_NAME || "ai_pipeline_docs";
    this.vectorSize = 384; // for all-MiniLM-L6-v2
  }

  async initialize() {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        col => col.name === this.collectionName
      );

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: "Cosine",
          },
        });
        console.log(`Collection '${this.collectionName}' created successfully`);
      } else {
        console.log(`Collection '${this.collectionName}' already exists`);
      }
    } catch (error) {
      console.error("Error initializing vector store:", error);
      throw error;
    }
  }

  async addDocuments(documents, embeddings, metadata = []) {
    try {
      const points = documents.map((doc, index) => ({
        id: uuidv4(),
        vector: embeddings[index],
        payload: {
          content: doc,
          metadata: metadata[index] || {},
          timestamp: new Date().toISOString(),
        },
      }));

      await this.client.upsert(this.collectionName, {
        wait: true,
        points: points,
      });

      console.log(`Added ${points.length} documents to vector store`);
      return points.map(p => p.id);
    } catch (error) {
      console.error("Error adding documents:", error);
      throw error;
    }
  }

  async search(queryEmbedding, limit = 5) {
    try {
      const searchResult = await this.client.search(this.collectionName, {
        vector: queryEmbedding,
        limit: limit,
        with_payload: true,
      });

      return searchResult.map(result => ({
        id: result.id,
        score: result.score,
        content: result.payload.content,
        metadata: result.payload.metadata,
      }));
    } catch (error) {
      console.error("Error searching vector store:", error);
      throw error;
    }
  }

  async deleteCollection() {
    try {
      await this.client.deleteCollection(this.collectionName);
      console.log(`Collection '${this.collectionName}' deleted`);
    } catch (error) {
      console.error("Error deleting collection:", error);
      throw error;
    }
  }
}

export default new VectorStoreService();