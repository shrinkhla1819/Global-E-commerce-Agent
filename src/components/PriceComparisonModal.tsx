import React from 'react';
import { X, ExternalLink, TrendingDown, Loader2, BarChart2 } from 'lucide-react';
import { PriceComparison, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface PriceComparisonModalProps {
  product: Product | null;
  comparisons: PriceComparison[];
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

export const PriceComparisonModal: React.FC<PriceComparisonModalProps> = ({
  product,
  comparisons,
  isOpen,
  onClose,
  isLoading
}) => {
  if (!isOpen || !product) return null;

  const sortedComparisons = [...comparisons].sort((a, b) => a.price - b.price);

  const lowestPrice = sortedComparisons[0];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <BarChart2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Price Comparison</h2>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-gray-500 font-medium">Searching for the best prices...</p>
            </div>
          ) : comparisons.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <TrendingDown size={32} />
              </div>
              <p className="text-gray-500">No price comparisons found for this item.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedComparisons.map((comp, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    idx === 0 
                      ? "border-green-200 bg-green-50/50 ring-1 ring-green-100" 
                      : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                      idx === 0 ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                    )}>
                      {idx === 0 ? <TrendingDown size={18} /> : idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{comp.retailer}</h4>
                      {idx === 0 && <span className="text-[10px] uppercase font-black text-green-600 tracking-widest">Lowest Price</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-black",
                        idx === 0 ? "text-green-600" : "text-gray-900"
                      )}>
                        {comp.currency}{comp.price.toLocaleString()}
                      </p>
                    </div>
                    <a
                      href={comp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
            Prices are retrieved in real-time and may vary.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
