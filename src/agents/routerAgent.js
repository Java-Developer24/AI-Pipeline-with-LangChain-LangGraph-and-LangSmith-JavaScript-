import groqService from '../services/groqService.js';

class RouterAgent {
  async classifyIntent(userMessage) {
    try {
      const prompt = `Classify the following user message into one of two categories:
1. "weather" - if the user is asking about weather, temperature, or climate conditions
2. "pdf" - if the user is asking a question that requires information from documents

User message: "${userMessage}"

Respond with ONLY one word: either "weather" or "pdf"`;

      const response = await groqService.chat([
        { role: "system", content: "You are a classifier that determines user intent." },
        { role: "user", content: prompt }
      ]);

      const intent = response.toLowerCase().trim();
      
      if (intent.includes('weather')) {
        return 'weather';
      } else if (intent.includes('pdf')) {
        return 'pdf';
      }
      
      // Default to pdf for general questions
      return 'pdf';
    } catch (error) {
      console.error("Error classifying intent:", error);
      // Default to pdf on error
      return 'pdf';
    }
  }

  extractCity(userMessage) {
  const lower = userMessage.toLowerCase();

  // common patterns
  const patterns = [
    /weather in ([a-z\s]+)/,
    /weather at ([a-z\s]+)/,
    /weather for ([a-z\s]+)/,
    /in ([a-z\s]+)$/,
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/[^a-z\s]/g, "");
    }
  }

  // fallback
  return "london";
}

}

export default new RouterAgent();