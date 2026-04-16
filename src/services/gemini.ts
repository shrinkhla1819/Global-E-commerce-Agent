import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Product, PriceComparison } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (aiInstance) return aiInstance;
  
  // Try all possible env locations for the key
  const apiKey = (process as any).env?.GEMINI_API_KEY || 
                 (import.meta as any).env?.VITE_GEMINI_API_KEY ||
                 (process as any).env?.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey.length < 5) {
    throw new Error("GEMINI_API_KEY is missing. Check Settings.");
  }
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
}

// Cache for search results to enable "instant" loading for repeated queries
const searchCache = new Map<string, { products: Product[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function searchProducts(query: string, page: number = 1): Promise<{ text: string; products: Product[]; isRealTime: boolean; error?: string }> {
  const serperKey = (process as any).env?.VITE_SERPER_API_KEY || (import.meta as any).env?.VITE_SERPER_API_KEY || (import.meta as any).env?.VITE_SERPER_API_KEY;
  if (!serperKey) {
    return { text: "Search Key Missing", products: [], isRealTime: true, error: "MISSING_KEY" };
  }

  const cacheKey = `${query.toLowerCase()}-${page}`;
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return { text: `Found ${cached.products.length} results (cached)`, products: cached.products, isRealTime: true };
  }

  try {
    const numToFetch = page === 1 ? 5 : 10;
    const response = await fetch("https://google.serper.dev/shopping", {
      method: "POST",
      headers: { 
        "X-API-KEY": serperKey, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        q: query, 
        gl: "in", 
        num: numToFetch, 
        page 
      }),
      keepalive: true
    });

    if (!response.ok) throw new Error(`API Error`);

    const data = await response.json();
    const items = (data.shopping || []).slice(0, numToFetch);
    
    const products: Product[] = items.map((item: any, index: number) => {
      return {
        id: `s-${page}-${index}-${Date.now()}`,
        name: item.title,
        description: item.snippet || item.title,
        price: parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0,
        currency: '₹',
        imageUrl: item.image || item.thumbnail || "",
        thumbnailUrl: item.thumbnail || item.image || "",
        sourceUrl: item.link,
        sourceName: item.source,
        brand: item.brand || item.source,
        rating: item.rating,
        reviewCount: item.reviews,
        category: 'Search Result'
      };
    });

    if (products.length > 0) searchCache.set(cacheKey, { products, timestamp: Date.now() });

    return { 
      text: products.length > 0 ? `Found ${products.length} results via Google Shopping` : "No results found.", 
      products, 
      isRealTime: true 
    };
  } catch (e) {
    console.error("Search failed", e);
    return { text: "Search failed. Please try again.", products: [], isRealTime: true, error: "FAILED" };
  }
}

export async function interactWithSite(url: string, action: 'view' | 'add_to_cart' | 'checkout', options?: any): Promise<any> {
  try {
    const response = await fetch('/api/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, action, options })
    });
    if (!response.ok) throw new Error('Interaction failed');
    return await response.json();
  } catch (e) {
    console.error('Interaction error:', e);
    throw e;
  }
}

export async function comparePrices(productName: string): Promise<PriceComparison[]> {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-flash-latest",
      contents: `Compare prices for "${productName}" across multiple online retailers globally. 
      Find at least 3-5 different sources. 
      Return the results as a JSON array of objects with retailer name, price, currency, and URL.
      CRITICAL: Convert all prices to INR (Indian Rupee) and use "₹" as the currency symbol.`,
      config: {
        systemInstruction: "You are a price comparison expert. Your goal is to find the lowest available price for a specific product across the web. Use Google Search to find current prices from different retailers. ALWAYS provide prices in INR.",
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              retailer: { type: Type.STRING },
              price: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["retailer", "price", "currency", "url"]
          }
        }
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse price comparison", e);
    return [];
  }
}

export async function chatWithAgent(message: string, history: any[]) {
  const tools = [
    { googleSearch: {} },
    {
      functionDeclarations: [
        {
          name: "search_products",
          description: "Search for real-time products to buy.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "The product search query" }
            },
            required: ["query"]
          }
        },
        {
          name: "add_to_cart",
          description: "Add a product from the search results to the shopping cart.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              index: { type: Type.NUMBER, description: "The 1-based index of the product in the most recent search results." }
            },
            required: ["index"]
          }
        },
        {
          name: "proceed_to_checkout",
          description: "Trigger the checkout process once the user is ready.",
          parameters: {
            type: Type.OBJECT,
            properties: {}
          }
        },
        {
          name: "interact_with_site",
          description: "Perform real-time actions on a specific merchant website using a headless browser.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              index: { type: Type.NUMBER, description: "The 1-based index of the product from search results to interact with." },
              action: { 
                type: Type.STRING, 
                enum: ["view", "add_to_cart", "checkout"],
                description: "The action to perform in the merchant's site." 
              }
            },
            required: ["index", "action"]
          }
        }
      ] as FunctionDeclaration[]
    }
  ];

  try {
    const chat = getAI().chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are a professional shopping assistant. 
        Architecture:
        1. Search: Use 'search_products' (Google Shopping) to find products.
        2. Action: When a user want to see a product or add to cart, ALWAYS use 'interact_with_site'.
        'interact_with_site' opens the actual site (Amazon, etc) using Playwright to handle variants and adding to cart.
        3. Checkout: Use 'proceed_to_checkout' to collect address details later.
        Be concise. Use emojis!`,
        tools,
        toolConfig: { includeServerSideToolInvocations: true }
      },
      history: history.length > 0 ? history : undefined
    });

    const response = await chat.sendMessage({ message });
    return response;
  } catch (e) {
    console.error("Chat Error:", e);
    throw e;
  }
}
