import { ChatGroq } from "@langchain/groq";

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

import dotenv from 'dotenv';

dotenv.config();

class GroqService {
  constructor() {
    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "openai/gpt-oss-20b", // or "llama2-70b-4096"
      temperature: 0.7,
      maxTokens: 1024,
    });

    // Using HuggingFace embeddings as alternative since Groq doesn't provide embeddings
    this.embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HF_API_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

  }

  async chat(messages) {
    try {
      const response = await this.llm.invoke(messages);
      return response.content;
    } catch (error) {
      console.error("Groq API Error:", error);
      throw error;
    }
  }

  async generateEmbedding(text) {
    try {
      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      console.error("Embedding Error:", error);
      throw error;
    }
  }

  async generateEmbeddings(texts) {
    try {
      const embeddings = await this.embeddings.embedDocuments(texts);
      return embeddings;
    } catch (error) {
      console.error("Embeddings Error:", error);
      throw error;
    }
  }
}

export default new GroqService();