import React, { useState } from 'react';
import { X, Copy, ExternalLink, Check, ShoppingBag, MapPin, User, ChevronRight } from 'lucide-react';
import { CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  address: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export const CheckoutAssistant: React.FC<CheckoutAssistantProps> = ({ isOpen, onClose, items, address }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 leading-tight">Checkout Assistant</h2>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Ready to complete your order</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                I can't directly pay on external sites for security reasons. 
                Use the buttons below to <b>copy your address</b> and paste it on the merchant's checkout page!
              </p>
          </div>

          {/* Address Copy Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <MapPin size={12} />
              Your Shipping Details
            </h3>
            
            <div className="grid gap-3">
              {[
                { label: 'Full Name', value: address.fullName, icon: <User size={14} /> },
                { label: 'Address', value: address.street, icon: <MapPin size={14} /> },
                { label: 'City', value: address.city },
                { label: 'State', value: address.state },
                { label: 'Zip Code', value: address.zip },
              ].map((field) => (
                <div key={field.label} className="group relative flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-200 transition-all">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{field.label}</span>
                    <span className="text-sm font-semibold text-gray-800">{field.value}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(field.value, field.label)}
                    className="p-2 bg-white text-gray-400 hover:text-blue-600 rounded-lg shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2"
                  >
                    {copiedField === field.label ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <ShoppingBag size={12} />
              Items to Purchase
            </h3>
            
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                    <img src={item.thumbnailUrl || item.imageUrl} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 uppercase font-black">{item.sourceName} • ₹{item.price.toLocaleString()}</p>
                  </div>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all flex items-center gap-1.5"
                  >
                    Pay
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => {
              items.forEach(item => window.open(item.sourceUrl, '_blank'));
            }}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-200"
          >
            Open All Stores to Checkout
            <ChevronRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
