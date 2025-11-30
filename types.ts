export interface StockData {
  ticker: string;
  price: number;
  fcfPerShare: number;
  beta: number;
  riskFreeRate: number; // Decimal (e.g., 0.045 for 4.5%)
  marketRiskPremium: number; // Decimal (e.g., 0.055 for 5.5%)
  currency: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface CalculationResult {
  costOfEquity: number;
  implicitGrowth: number;
  fcfYield: number;
}

export interface SearchResult {
  data: StockData | null;
  sources: GroundingSource[];
  rawText?: string;
}
