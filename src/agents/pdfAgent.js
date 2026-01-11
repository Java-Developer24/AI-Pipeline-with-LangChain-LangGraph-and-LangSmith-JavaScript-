import groqService from '../services/groqService.js';
import vectorStore from '../services/vectorStore.js';
import pdfProcessor from '../services/pdfProcessor.js';

class PDFAgent {
  async processPDFDocument(pdfPath) {
    try {
      // Extract and chunk PDF text
      const { chunks } = await pdfProcessor.processPDF(pdfPath);

      // Generate embeddings
      const embeddings = await groqService.generateEmbeddings(chunks);

      // Store in vector database
      const metadata = chunks.map((chunk, index) => ({
        source: pdfPath,
        chunkIndex: index,
      }));

      await vectorStore.addDocuments(chunks, embeddings, metadata);

      return {
        success: true,
        chunksProcessed: chunks.length,
      };
    } catch (error) {
      console.error("Error processing PDF:", error);
      throw error;
    }
  }

  async queryPDF(question) {
    try {
      // Generate embedding for the question
      const questionEmbedding = await groqService.generateEmbedding(question);

      // Search vector store
      const results = await vectorStore.search(questionEmbedding, 3);

      if (results.length === 0) {
        return "No relevant information found in the PDF documents.";
      }

      // Create context from retrieved documents
      const context = results
        .map((result, index) => `[${index + 1}] ${result.content}`)
        .join('\n\n');

      // Generate answer using RAG
      const prompt = `Based on the following context from PDF documents, answer the question.

Context:
${context}

Question: ${question}

Answer:`;

      const answer = await groqService.chat([
        { role: "system", content: "You are a helpful assistant that answers questions based on provided context. If the answer is not in the context, say so." },
        { role: "user", content: prompt }
      ]);

      return {
        answer: answer,
        sources: results.map(r => ({
          content: r.content.substring(0, 200) + '...',
          score: r.score,
        })),
      };
    } catch (error) {
      console.error("Error querying PDF:", error);
      throw error;
    }
  }
}

export default new PDFAgent();