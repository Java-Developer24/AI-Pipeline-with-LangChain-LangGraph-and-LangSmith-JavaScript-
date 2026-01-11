import { StateGraph, END } from "@langchain/langgraph";
import routerAgent from '../agents/routerAgent.js';
import weatherAgent from '../agents/weatherAgent.js';
import pdfAgent from '../agents/pdfAgent.js';
import groqService from '../services/groqService.js';

class PipelineState {
  constructor() {
    this.userMessage = "";
    this.intent = "";
    this.city = "";
    this.weatherData = null;
    this.pdfAnswer = null;
    this.finalResponse = "";
    this.error = null;
  }
}

class Pipeline {
  constructor() {
    this.graph = this.buildGraph();
  }

  buildGraph() {
    const workflow = new StateGraph({
      channels: {
        userMessage: null,
        intent: null,
        city: null,
        weatherData: null,
        pdfAnswer: null,
        finalResponse: null,
        error: null,
      }
    });

    // Define nodes
    workflow.addNode("router", this.routerNode.bind(this));
    workflow.addNode("weather", this.weatherNode.bind(this));
    workflow.addNode("pdf", this.pdfNode.bind(this));
    workflow.addNode("synthesize", this.synthesizeNode.bind(this));

    // Define edges
    workflow.addEdge("__start__", "router");
    
    workflow.addConditionalEdges(
      "router",
      this.routeDecision.bind(this),
      {
        weather: "weather",
        pdf: "pdf",
        error: END,
      }
    );

    workflow.addEdge("weather", "synthesize");
    workflow.addEdge("pdf", "synthesize");
    workflow.addEdge("synthesize", END);

    return workflow.compile();
  }

  async routerNode(state) {
    try {
      const intent = await routerAgent.classifyIntent(state.userMessage);
      const city = routerAgent.extractCity(state.userMessage);
      
      return {
        ...state,
        intent,
        city: city || "London", // Default city
      };
    } catch (error) {
      return {
        ...state,
        error: error.message,
      };
    }
  }

  routeDecision(state) {
    if (state.error) return "error";
    return state.intent;
  }

  async weatherNode(state) {
    try {
      const weatherData = await weatherAgent.getWeather(state.city);
      return {
        ...state,
        weatherData,
      };
    } catch (error) {
      return {
        ...state,
        error: error.message,
      };
    }
  }

  async pdfNode(state) {
    try {
      const answer = await pdfAgent.queryPDF(state.userMessage);
      return {
        ...state,
        pdfAnswer: answer,
      };
    } catch (error) {
      return {
        ...state,
        error: error.message,
      };
    }
  }

  async synthesizeNode(state) {
    try {
      let finalResponse;

      if (state.weatherData) {
        const formattedWeather = weatherAgent.formatWeatherData(state.weatherData);
        
        const prompt = `The user asked: "${state.userMessage}"

Here is the weather data:
${formattedWeather}

Please provide a natural, conversational response to the user's question.`;

        finalResponse = await groqService.chat([
          { role: "system", content: "You are a helpful weather assistant." },
          { role: "user", content: prompt }
        ]);
      } else if (state.pdfAnswer) {
        finalResponse = typeof state.pdfAnswer === 'string' 
          ? state.pdfAnswer 
          : state.pdfAnswer.answer;
      } else {
        finalResponse = "I couldn't process your request.";
      }

      return {
        ...state,
        finalResponse,
      };
    } catch (error) {
      return {
        ...state,
        error: error.message,
        finalResponse: "An error occurred while processing your request.",
      };
    }
  }

  async execute(userMessage) {
    const initialState = {
      userMessage,
      intent: "",
      city: "",
      weatherData: null,
      pdfAnswer: null,
      finalResponse: "",
      error: null,
    };

    const result = await this.graph.invoke(initialState);
    return result;
  }
}

export default new Pipeline();