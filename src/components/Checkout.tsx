import React, { useState } from 'react';
import { X, CreditCard, Truck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { CheckoutDetails, CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onComplete: (details: CheckoutDetails) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ isOpen, onClose, items, onComplete }) => {
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [details, setDetails] = useState<CheckoutDetails>({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: 'cod'
  });

  const total = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('success');
    onComplete(details);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Left Side: Summary (Hidden on mobile if needed) */}
          <div className="w-full md:w-1/3 bg-gray-50 p-8 border-r border-gray-100 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>
            <div className="space-y-4 mb-8">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 truncate mr-2">{item.quantity}x {item.name}</span>
                  <span className="font-semibold text-gray-900 whitespace-nowrap">
                    {item.currency}{item.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-sm">Subtotal</span>
                <span className="font-medium text-gray-900">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-500 text-sm">Shipping</span>
                <span className="text-green-600 font-medium text-sm">FREE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="w-full md:w-2/3 p-8 bg-white overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <AnimatePresence mode="wait">
              {step === 'details' ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkout</h2>
                  <p className="text-gray-500 mb-8">Complete your purchase securely.</p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Full Name</label>
                        <input
                          required
                          type="text"
                          value={details.fullName}
                          onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Email Address</label>
                        <input
                          required
                          type="email"
                          value={details.email}
                          onChange={(e) => setDetails({ ...details, email: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Shipping Address</label>
                      <input
                        required
                        type="text"
                        value={details.address}
                        onChange={(e) => setDetails({ ...details, address: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="123 Street Name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">City</label>
                        <input
                          required
                          type="text"
                          value={details.city}
                          onChange={(e) => setDetails({ ...details, city: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="New York"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">ZIP Code</label>
                        <input
                          required
                          type="text"
                          value={details.zipCode}
                          onChange={(e) => setDetails({ ...details, zipCode: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="10001"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-gray-700 block">Payment Method</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setDetails({ ...details, paymentMethod: 'cod' })}
                          className={cn(
                            "flex items-center justify-center gap-3 p-4 border-2 rounded-2xl transition-all",
                            details.paymentMethod === 'cod'
                              ? "border-blue-600 bg-blue-50 text-blue-600 shadow-sm"
                              : "border-gray-100 hover:border-gray-200 text-gray-500"
                          )}
                        >
                          <Truck size={20} />
                          <span className="font-semibold">COD</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetails({ ...details, paymentMethod: 'card' })}
                          className={cn(
                            "flex items-center justify-center gap-3 p-4 border-2 rounded-2xl transition-all",
                            details.paymentMethod === 'card'
                              ? "border-blue-600 bg-blue-50 text-blue-600 shadow-sm"
                              : "border-gray-100 hover:border-gray-200 text-gray-500"
                          )}
                        >
                          <CreditCard size={20} />
                          <span className="font-semibold">Card</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all active:scale-[0.98] shadow-xl shadow-blue-200 mt-4"
                    >
                      Place Order
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
                  <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                    Thank you for your purchase. Your order will be delivered soon.
                  </p>
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-8 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeft size={18} />
                    Back to Shopping
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
