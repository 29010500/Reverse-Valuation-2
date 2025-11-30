import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FinancialCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  colorClass?: string;
  isEditable?: boolean;
  onChange?: (value: string) => void;
  type?: "text" | "number";
  step?: string;
}

const FinancialCard: React.FC<FinancialCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  subtext, 
  colorClass = "text-slate-900",
  isEditable = false,
  onChange,
  type = "text",
  step
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4 transition-all hover:shadow-md">
      <div className={`p-3 rounded-lg bg-slate-50 ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        {isEditable ? (
          <input 
            type={type}
            step={step}
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            className={`text-2xl font-bold w-full bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none transition-colors ${colorClass}`}
          />
        ) : (
          <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        )}
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};

export default FinancialCard;
