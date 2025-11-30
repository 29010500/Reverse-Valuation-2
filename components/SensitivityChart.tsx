import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { StockData, CalculationResult } from '../types';

interface SensitivityChartProps {
  data: StockData;
  results: CalculationResult;
}

const SensitivityChart: React.FC<SensitivityChartProps> = ({ data, results }) => {
  const chartData = useMemo(() => {
    const currentPrice = data.price;
    const range = 0.5; // +/- 50%
    const steps = 20;
    const stepSize = (currentPrice * range * 2) / steps;
    const startPrice = currentPrice * (1 - range);

    const points = [];
    for (let i = 0; i <= steps; i++) {
      const p = startPrice + (i * stepSize);
      // g = Ke - (FCF / P)
      // Ke is assumed constant for price sensitivity typically, though Beta implies risk might change. 
      // We keep Ke constant to isolate Price impact.
      const impliedG = results.costOfEquity - (data.fcfPerShare / p);
      
      points.push({
        price: p,
        growth: impliedG * 100, // percentage
      });
    }
    return points;
  }, [data.price, data.fcfPerShare, results.costOfEquity]);

  return (
    <div className="w-full h-64 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Sensitivity: Growth (g) vs Stock Price</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="price" 
            label={{ value: 'Stock Price ($)', position: 'insideBottom', offset: -15, style: { fill: '#64748b', fontSize: 12 } }} 
            tickFormatter={(val) => val.toFixed(0)}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            label={{ value: 'Implicit Growth (%)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 12 } }}
            tickFormatter={(val) => val.toFixed(1)}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'Implied Growth']}
            labelFormatter={(label: number) => `Price: $${label.toFixed(2)}`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <ReferenceLine x={data.price} stroke="#3b82f6" strokeDasharray="3 3">
            <Label value="Current" position="insideTopLeft" fill="#3b82f6" fontSize={12} />
          </ReferenceLine>
          <ReferenceLine y={results.implicitGrowth * 100} stroke="#3b82f6" strokeDasharray="3 3" />
          <Line 
            type="monotone" 
            dataKey="growth" 
            stroke="#0f172a" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SensitivityChart;
