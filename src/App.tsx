import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { PriceComparisonModal } from './components/PriceComparisonModal';
import { CheckoutAssistant } from './components/CheckoutAssistant';
import { CartItem, Product, CheckoutDetails, PriceComparison, Order } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Globe, History, CreditCard, Package } from 'lucide-react';
import { comparePrices } from './services/gemini';

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>(() => {
    const saved = localStorage.getItem('orderHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const handleAddSearchHistory = (query: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase());
      return [query, ...filtered].slice(0, 10);
    });
  };
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutAssistantOpen, setIsCheckoutAssistantOpen] = useState(false);
  const [collectedAddress, setCollectedAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zip: ''
  });
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    (window as any).dispatchCheckoutReady = (info: any) => {
      setCollectedAddress(info);
      setIsCheckoutAssistantOpen(true);
    };
  }, []);

  // Price Comparison State
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comparisons, setComparisons] = useState<PriceComparison[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleComparePrices = async (product: Product) => {
    setSelectedProduct(product);
    setIsComparisonOpen(true);
    setIsComparing(true);
    setComparisons([]);
    try {
      const results = await comparePrices(product.name);
      setComparisons(results);
    } catch (error) {
      console.error(error);
    } finally {
      setIsComparing(false);
    }
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckoutComplete = (details: CheckoutDetails) => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newOrder: Order = {
      id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      date: new Date().toLocaleString(),
      items: [...cartItems],
      total,
      details,
      status: 'completed'
    };

    setOrderHistory(prev => [newOrder, ...prev]);
    console.log('Order completed:', newOrder);
    
    setTimeout(() => {
      setCartItems([]);
      setIsCheckoutOpen(false);
    }, 3000);
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex overflow-hidden font-sans">
      {/* Sidebar / Info Panel (Desktop) */}
      <div className="hidden lg:flex flex-col w-80 bg-white border-r border-gray-100 p-6 space-y-8 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
            <Globe size={24} />
          </div>
          <span className="text-lg font-black tracking-tighter text-gray-900 uppercase">Global Agent</span>
        </div>

        <div className="space-y-6">
          {/* Search History */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Search size={12} />
              Recent Searches
            </h3>
            {searchHistory.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic px-1">No recent searches</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((query, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-md text-[10px] text-gray-600 font-medium">
                    {query}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <History size={12} />
              Order History
            </h3>
            
            {orderHistory.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center">
                <p className="text-[10px] text-gray-400">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderHistory.map((order) => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-blue-600">{order.id}</span>
                      <span className="text-[9px] text-gray-400">{order.date.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package size={12} className="text-gray-400" />
                      <span className="text-[10px] font-medium text-gray-700 truncate">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                      <div className="flex items-center gap-1">
                        <CreditCard size={10} className="text-green-500" />
                        <span className="text-[10px] font-bold text-gray-900">₹{order.total.toLocaleString()}</span>
                      </div>
                      <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase">
                        {order.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="text-[10px] text-gray-400 leading-relaxed text-center">
            Global Shopping Agent • Powered by Gemini
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 relative flex flex-col h-full">
        <ChatInterface 
          onAddToCart={handleAddToCart}
          onComparePrices={handleComparePrices}
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          onSearch={handleAddSearchHistory}
        />
      </main>

      {/* Overlays */}
      <Cart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <Checkout 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onComplete={handleCheckoutComplete}
      />

      <PriceComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        product={selectedProduct}
        comparisons={comparisons}
        isLoading={isComparing}
      />

      <CheckoutAssistant
        isOpen={isCheckoutAssistantOpen}
        onClose={() => setIsCheckoutAssistantOpen(false)}
        items={cartItems}
        address={collectedAddress}
      />

      {/* Welcome Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="max-w-lg w-full bg-white rounded-[40px] p-12 text-center space-y-8 shadow-2xl"
            >
              <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-500/40 animate-bounce">
                <ShoppingBag size={48} />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tight text-gray-900">Global E-commerce Agent</h2>
                <p className="text-gray-500 text-lg leading-relaxed">
                  Your intelligent companion for finding products from any corner of the globe.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 py-4">
                <div className="space-y-2">
                  <div className="text-2xl font-black text-gray-900">∞</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Products</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-black text-gray-900">190+</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Countries</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-black text-gray-900">1</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Universal Cart</div>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="w-full py-5 bg-black text-white rounded-3xl font-bold text-xl hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-black/20"
              >
                Start Shopping
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
