import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Search, ShoppingBag, Heart, Mic, MicOff } from 'lucide-react';
import { Message, Product } from '../types';
import { searchProducts } from '../services/gemini';
import { ProductCard } from './ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  onAddToCart: (product: Product) => void;
  onComparePrices: (product: Product) => void;
  cartCount: number;
  onOpenCart: () => void;
  onSearch: (query: string) => void;
}

// Speech Recognition Type Definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onAddToCart, 
  onComparePrices,
  cartCount, 
  onOpenCart,
  onSearch,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Hello! I'm your Global Shopping Agent. What are you looking for today? I can find products from all over the world for you."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current!.continuous = false;
      recognitionRef.current!.interimResults = false;
      recognitionRef.current!.lang = 'en-US';

      recognitionRef.current!.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current!.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current!.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSend = async (overrideInput?: string, isLoadMore: boolean = false) => {
    const userMessage = overrideInput || input.trim();
    if (!userMessage || isLoading) return;

    if (!isLoadMore) {
      setInput('');
      setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
      setCurrentQuery(userMessage);
      setCurrentPage(1);
      onSearch(userMessage);
    }
    
    setIsLoading(true);

    try {
      const pageToFetch = isLoadMore ? currentPage + 1 : 1;
      const result = await searchProducts(userMessage, pageToFetch);
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: result.text,
        products: result.products,
        isRealTime: result.isRealTime,
        error: result.error
      }]);
      
      if (isLoadMore) {
        setCurrentPage(pageToFetch);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "I'm sorry, I encountered an error while searching. Please try again.";
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: errorMessage 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Shopping Agent</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Search Engine Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCart}
            className="relative p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
          >
            <ShoppingBag size={22} className="text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[85%] space-y-4 ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className={`p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gray-900 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  {msg.role === 'model' && msg.products && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                          Real-time Search Results
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {msg.products && msg.products.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {msg.products.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          onAddToCart={onAddToCart}
                          onComparePrices={onComparePrices}
                        />
                      ))}
                    </div>
                    {idx === messages.length - 1 && !isLoading && (
                      <button
                        onClick={() => handleSend(currentQuery, true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                      >
                        <Search size={16} className="text-blue-600" />
                        Load More Options
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            className="flex gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-gray-400 shadow-sm">
              <div className="w-4 h-4 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">Finding...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex gap-4 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening..." : "I want to buy a high-end headphone..."}
              className={`w-full pl-6 pr-16 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner ${
                isListening ? 'ring-2 ring-red-400 border-transparent' : ''
              }`}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || isListening}
              className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-blue-200"
            >
              <Send size={20} />
            </button>
          </div>
          
          <button
            onClick={toggleListening}
            disabled={isLoading}
            className={`p-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center shadow-lg ${
              isListening 
                ? 'bg-red-500 text-white shadow-red-200 animate-pulse' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-gray-200'
            }`}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">
          Powered by Gemini AI with Google Search Grounding
        </p>
      </div>
    </div>
  );
};
