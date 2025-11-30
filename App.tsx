import React, { useState, useCallback, useMemo } from 'react';
import { Search, TrendingUp, DollarSign, Activity, Percent, BookOpen, Calculator, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchStockData } from './services/geminiService';
import { StockData, SearchResult, CalculationResult } from './types';
import FinancialCard from './components/FinancialCard';
import SensitivityChart from './components/SensitivityChart';

const DEFAULT_DATA: StockData = {
  ticker: 'EXAMPLE',
  price: 150.00,
  fcfPerShare: 7.50,
  beta: 1.10,
  riskFreeRate: 0.042,
  marketRiskPremium: 0.055,
  currency: 'USD'
};

const App: React.FC = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  
  // Initialize with default data
  const [data, setData] = useState<StockData>(DEFAULT_DATA);

  const calculateResults = useCallback((currentData: StockData): CalculationResult => {
    // Ke = Rf + Beta * (MRP)
    const costOfEquity = currentData.riskFreeRate + (currentData.beta * currentData.marketRiskPremium);
    
    // FCF Yield = FCF / Price
    const fcfYield = currentData.price !== 0 ? currentData.fcfPerShare / currentData.price : 0;
    
    // g = Ke - (FCF / Price)
    const implicitGrowth = costOfEquity - fcfYield;

    return {
      costOfEquity,
      implicitGrowth,
      fcfYield
    };
  }, []);

  const results: CalculationResult = useMemo(() => {
    return calculateResults(data);
  }, [data, calculateResults]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      const result = await fetchStockData(ticker);
      if (result.data) {
        setSearchResult(result);
        setData(result.data);
      } else {
        setError("Could not find sufficient data for this ticker. Please try again or enter details manually.");
      }
    } catch (err: any) {
      console.error("Full Error Object:", err);
      
      const errorMessage = err.message || JSON.stringify(err);
      
      if (errorMessage.includes("leaked") || errorMessage.includes("reported as leaked")) {
         setError("SECURITY ALERT: Your API Key has been blocked by Google because it was detected publicly. Please generate a NEW key at aistudio.google.com, update your Netlify Environment Variables, and Redeploy.");
      } else if (errorMessage.includes("API Key")) {
         setError("Configuration Error: API Key not found. Please check your Netlify Environment Variables.");
      } else {
         setError("Unable to fetch live data. Please enter values manually.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(DEFAULT_DATA);
    setTicker('');
    setSearchResult(null);
    setError(null);
  };

  const updateField = (field: keyof StockData, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setData({ ...data, [field]: numValue });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative">
      
      <div className="text-center mb-10 max-w-2xl mt-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
          Implicit Growth <span className="text-blue-600">Calculator</span>
        </h1>
        <p className="text-lg text-slate-600">
          Reverse engineer the growth rate embedded in a stock price. 
          <span className="hidden sm:inline"> Use the search bar to fetch live data or enter values manually below.</span>
        </p>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-md mb-8">
        <form onSubmit={handleSearch} className="relative group z-10">
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 shadow-sm text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-slate-400"
            placeholder="Enter stock ticker (e.g. AAPL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
          <button 
            type="submit"
            disabled={loading || !ticker}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-6 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Auto-Fill'}
          </button>
        </form>
        {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        )}
      </div>

      <div className="w-full max-w-6xl animate-fade-in-up">
        
        {/* Main Result Hero */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                   <h2 className="text-blue-200 font-semibold text-lg uppercase tracking-wider">
                     {data.ticker === 'EXAMPLE' ? 'Implied Growth (Example)' : `Implied Growth (${data.ticker})`}
                   </h2>
                   {data.ticker !== 'EXAMPLE' && (
                     <button onClick={handleReset} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Reset to default">
                       <RefreshCw className="w-4 h-4 text-blue-300" />
                     </button>
                   )}
                </div>
                
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className={`text-6xl md:text-7xl font-bold tracking-tighter ${results.implicitGrowth < 0 ? 'text-red-300' : 'text-white'}`}>
                    {(results.implicitGrowth * 100).toFixed(2)}%
                  </span>
                  <span className="text-blue-300 font-medium text-xl">perpetuity</span>
                </div>
                <p className="text-blue-100/80 mt-4 max-w-md text-sm leading-relaxed">
                  The market is currently pricing <strong>{data.ticker}</strong> as if its Free Cash Flow will grow at 
                  <span className="font-bold text-white"> {(results.implicitGrowth * 100).toFixed(2)}% </span> 
                  annually forever.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 min-w-[300px] border border-white/10">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <span className="text-blue-200">Cost of Equity (Ke)</span>
                  <span className="text-2xl font-bold">{(results.costOfEquity * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-200">FCF Yield</span>
                  <span className="text-2xl font-bold">{(results.fcfYield * 100).toFixed(2)}%</span>
                </div>
                <div className="mt-4 text-xs text-blue-300/60 font-mono text-center">
                  g = Ke - (FCF / P)
                </div>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Parameters Column */}
          <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Model Inputs
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                  Editable
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FinancialCard 
                  title="Stock Price" 
                  value={data.price} 
                  icon={DollarSign} 
                  colorClass="text-green-600"
                  isEditable
                  type="number"
                  step="0.01"
                  onChange={(v) => updateField('price', v)}
                  subtext={data.currency}
                />
                <FinancialCard 
                  title="FCF per Share (TTM)" 
                  value={data.fcfPerShare} 
                  icon={Activity} 
                  colorClass="text-emerald-600"
                  isEditable
                  type="number"
                  step="0.01"
                  onChange={(v) => updateField('fcfPerShare', v)}
                  subtext="Trailing 12 Months"
                />
                <FinancialCard 
                  title="Risk Free Rate" 
                  value={data.riskFreeRate} 
                  icon={Percent} 
                  colorClass="text-indigo-600"
                  isEditable
                  type="number"
                  step="0.001"
                  onChange={(v) => updateField('riskFreeRate', v)}
                  subtext="US 10Y Treasury"
                />
                <FinancialCard 
                  title="Beta" 
                  value={data.beta} 
                  icon={TrendingUp} 
                  colorClass="text-orange-600"
                  isEditable
                  type="number"
                  step="0.01"
                  onChange={(v) => updateField('beta', v)}
                  subtext="5Y Monthly"
                />
                <FinancialCard 
                  title="Market Risk Premium" 
                  value={data.marketRiskPremium} 
                  icon={Activity} 
                  colorClass="text-purple-600"
                  isEditable
                  type="number"
                  step="0.001"
                  onChange={(v) => updateField('marketRiskPremium', v)}
                  subtext="Rm - Rf"
                />
              </div>

              {/* Sensitivity Chart */}
              <div className="mt-8">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Analysis
                  </h3>
                  <SensitivityChart data={data} results={results} />
              </div>
          </div>

          {/* Sidebar / Sources */}
          <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Formula
                  </h3>
                  <div className="space-y-4 text-sm text-slate-600">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="font-mono text-slate-800 font-semibold mb-1">g = K<sub>e</sub> - (FCF / P)</p>
                        <p className="text-xs text-slate-500">Reverse DCF Formula</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="font-mono text-slate-800 font-semibold mb-1">K<sub>e</sub> = R<sub>f</sub> + β(R<sub>m</sub>)</p>
                        <p className="text-xs text-slate-500">CAPM Model</p>
                      </div>
                      <ul className="space-y-2 list-disc list-inside text-xs text-slate-500 mt-2">
                          <li><strong className="text-slate-700">g:</strong> Implicit Growth Rate</li>
                          <li><strong className="text-slate-700">K<sub>e</sub>:</strong> Cost of Equity</li>
                          <li><strong className="text-slate-700">FCF:</strong> Free Cash Flow per Share</li>
                          <li><strong className="text-slate-700">P:</strong> Current Price</li>
                      </ul>
                  </div>
              </div>

              {searchResult && searchResult.sources.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                          <RotateCcw className="w-5 h-5 text-blue-600" />
                          Data Sources
                      </h3>
                      <div className="space-y-3">
                          {searchResult.sources.slice(0, 5).map((source, idx) => (
                              <a 
                                  key={idx} 
                                  href={source.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                              >
                                  <div className="text-sm font-medium text-blue-600 group-hover:text-blue-800 truncate">
                                      {source.title}
                                  </div>
                                  <div className="text-xs text-slate-400 truncate mt-1">
                                      {new URL(source.uri).hostname}
                                  </div>
                              </a>
                          ))}
                      </div>
                    </div>
              ) : (
                 <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-400">
                    <p className="text-sm">Enter a stock ticker above to automatically fetch sources and data.</p>
                 </div>
              )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-20 text-center text-slate-400 text-sm pb-8">
        <p>
            {searchResult ? "Data provided by Gemini 2.5 Flash via Google Search." : "Manual Calculation Mode."} 
            Financial figures are estimates and should not be used for investment advice.
        </p>
      </footer>
    </div>
  );
};

export default App;