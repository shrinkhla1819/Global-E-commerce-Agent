import React from 'react';
import { Heart, X, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { WishlistItem, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface WishlistProps {
  items: WishlistItem[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveItem: (id: string) => void;
  onMoveToCart: (product: Product) => void;
}

export const Wishlist: React.FC<WishlistProps> = ({
  items,
  isOpen,
  onClose,
  onRemoveItem,
  onMoveToCart
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-bottom flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 text-white rounded-xl">
                  <Heart size={20} fill="currentColor" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">My Wishlist</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <Heart size={40} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Your wishlist is empty</h3>
                    <p className="text-gray-500">Save items you love for later.</p>
                  </div>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-4 group"
                  >
                    <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-gray-900 truncate pr-4">{item.name}</h4>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{item.sourceName}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">
                          {item.currency}{item.price}
                        </span>
                        <button
                          onClick={() => onMoveToCart(item)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                        >
                          <ShoppingCart size={14} />
                          Move to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
