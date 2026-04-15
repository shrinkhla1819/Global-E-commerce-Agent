import React from 'react';
import { ShoppingCart, ExternalLink, Plus, Heart, Star, BarChart2 } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onComparePrices: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onComparePrices,
}) => {
  const [imgSrc, setImgSrc] = React.useState<string>(() => {
    if (product.thumbnailUrl) return product.thumbnailUrl;
    if (product.imageUrl) return product.imageUrl;
    const seed = encodeURIComponent(product.name.substring(0, 30));
    return `https://picsum.photos/seed/${seed}/500/500`;
  });
  const [retryCount, setRetryCount] = React.useState(0);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Sync image source when product changes
  React.useEffect(() => {
    const initialSrc = product.thumbnailUrl || product.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(product.name.substring(0, 30))}/500/500`;
    setImgSrc(initialSrc);
    setRetryCount(0);
    setIsLoaded(false);
  }, [product.imageUrl, product.thumbnailUrl, product.id, product.name]);

  const handleImageError = () => {
    const proxies = [
      (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=600&h=600&fit=contain&bg=white`,
      (url: string) => `https://i0.wp.com/${url.replace(/^https?:\/\//, '')}?w=600`,
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    if (retryCount < proxies.length && product.imageUrl) {
      setImgSrc(proxies[retryCount](product.imageUrl));
      setRetryCount(prev => prev + 1);
    } else if (retryCount === proxies.length && product.thumbnailUrl && product.thumbnailUrl !== product.imageUrl) {
      // One last try with the thumbnail if we haven't already
      setImgSrc(product.thumbnailUrl);
      setRetryCount(prev => prev + 1);
    } else {
      // Final fallback to placeholder
      const seed = encodeURIComponent(product.name.substring(0, 30));
      setImgSrc(`https://picsum.photos/seed/${seed}/500/500`);
      setRetryCount(99); // Stop retrying
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50 flex items-center justify-center">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
        
        <img
          key={`${product.id}-${retryCount}`}
          src={imgSrc}
          alt={product.name}
          className={cn(
            "w-full h-full object-contain p-2 group-hover:scale-105 transition-all duration-200 relative z-10",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
        />
        <div className="absolute top-2 left-2 z-20">
          <span className="px-2 py-1 bg-white/95 backdrop-blur-sm rounded-md text-[10px] font-bold text-gray-600 uppercase tracking-wider shadow-md border border-gray-100">
            Global Find
          </span>
        </div>
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
          <a
            href={product.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-gray-700 hover:text-blue-600 transition-all shadow-md border border-gray-100 group/link"
            title={`View on ${product.sourceName}`}
          >
            <ExternalLink size={14} className="group-hover/link:scale-110 transition-transform" />
            <span className="text-[10px] font-bold truncate max-w-[80px]">{product.sourceName}</span>
          </a>
        </div>
        {product.rating && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-1 text-xs font-bold text-gray-700 shadow-sm">
            <Star size={12} className="text-green-600 fill-green-600" />
            {product.rating}
            {product.reviewCount && (
              <span className="text-gray-400 font-medium ml-1">({product.reviewCount})</span>
            )}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1 mb-0.5">{product.name}</h3>
          {product.brand && <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{product.brand}</p>}
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="font-black text-lg text-gray-900">
            {product.currency}{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {product.currency}{product.originalPrice.toLocaleString()}
            </span>
          )}
          {product.discount && (
            <span className="text-xs font-bold text-green-600">
              {product.discount}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 line-clamp-3 mb-4 h-12 overflow-hidden leading-relaxed">
          {product.description}
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5"
            >
              <img 
                src={`https://www.google.com/s2/favicons?domain=${new URL(product.sourceUrl).hostname}&sz=32`} 
                alt="" 
                className="w-3 h-3 rounded-sm"
                referrerPolicy="no-referrer"
              />
              {product.sourceName}
              <ExternalLink size={10} />
            </a>
            <button
              onClick={() => onAddToCart(product)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors active:scale-95"
            >
              <Plus size={16} />
              Add to Cart
            </button>
          </div>
          <button
            onClick={() => onComparePrices(product)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            <BarChart2 size={14} />
            Compare Prices
          </button>
        </div>
      </div>
    </motion.div>
  );
};
