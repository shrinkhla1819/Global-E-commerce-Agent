export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  currency: string;
  imageUrl: string;
  thumbnailUrl?: string;
  sourceUrl: string;
  sourceName: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface WishlistItem extends Product {
  addedAt: number;
}

export interface PriceComparison {
  retailer: string;
  price: number;
  currency: string;
  url: string;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  details: CheckoutDetails;
  status: 'completed' | 'pending' | 'shipped';
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  products?: Product[];
  isRealTime?: boolean;
  error?: string;
}

export interface CheckoutDetails {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  paymentMethod: 'cod' | 'card';
}
