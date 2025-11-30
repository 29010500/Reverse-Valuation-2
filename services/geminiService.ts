import { GoogleGenAI } from "@google/genai";
import { SearchResult, StockData, GroundingSource } from "../types";

const parseCodeBlock = (text: string): any => {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error("Failed to parse JSON from code block", e);
    }
  }
  // Fallback: try to find the first '{' and last '}'
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(text.substring(start, end + 1));
    } catch (e) {
      console.error("Failed to parse loose JSON", e);
    }
  }
  return null;
};

export const fetchStockData = async (ticker: string): Promise<SearchResult> => {
  // STRICT REQUIREMENT: API Key must come from process.env.API_KEY
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing. Please configure the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    I need to calculate the implicit growth rate for the stock "${ticker}".
    Please search specifically for the following latest financial data for ${ticker}:
    1. Current Stock Price.
    2. Free Cash Flow (FCF) per share (Trailing Twelve Months - TTM). If FCF per share is not explicitly stated, look for Total Free Cash Flow and Shares Outstanding to calculate it.
    3. Beta (5-year Monthly).
    4. Current Risk Free Rate (use the US 10-Year Treasury Yield).
    5. Equity Risk Premium (Market Risk Premium) for the appropriate market (default to US if not specified, typically around 4.5% to 6.0%).

    Return the data in a JSON object strictly following this schema inside a markdown code block:
    \`\`\`json
    {
      "price": number,
      "fcfPerShare": number,
      "beta": number,
      "riskFreeRate": number (decimal, e.g. 0.042 for 4.2%),
      "marketRiskPremium": number (decimal, e.g. 0.05 for 5%),
      "currency": string (e.g. "USD")
    }
    \`\`\`
    
    If you cannot find an exact number, make a reasonable estimate based on the search results and recently available data.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const parsedData = parseCodeBlock(text);
    
    // Extract grounding sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri,
      }));

    // Remove duplicates based on URI
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    let stockData: StockData | null = null;

    if (parsedData) {
      stockData = {
        ticker: ticker.toUpperCase(),
        price: Number(parsedData.price) || 0,
        fcfPerShare: Number(parsedData.fcfPerShare) || 0,
        beta: Number(parsedData.beta) || 1,
        riskFreeRate: Number(parsedData.riskFreeRate) || 0.04,
        marketRiskPremium: Number(parsedData.marketRiskPremium) || 0.05,
        currency: parsedData.currency || "USD",
      };
    }

    return {
      data: stockData,
      sources: uniqueSources,
      rawText: text,
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};