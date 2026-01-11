import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

class PDFProcessor {
  async processPDF(pdfPath) {
    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();

    const chunks = docs.map(doc => doc.pageContent);

    return {
      fullText: chunks.join("\n"),
      chunks,
    };
  }
}

export default new PDFProcessor();
