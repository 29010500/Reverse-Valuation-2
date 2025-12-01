import { SearchResult, StockData, GroundingSource } from "../types";

export const fetchStockData = async (ticker: string): Promise<SearchResult> => {
  try {
    // We now call the backend function instead of the API directly
    const response = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ticker }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    
    const parsedData = result.data;
    const uniqueSources = result.sources || [];
    const text = result.rawText || "";

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
    console.error("Data Fetch Error:", error);
    throw error;
  }
};