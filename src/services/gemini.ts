import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Product, PriceComparison } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (aiInstance) return aiInstance;
  
  // Robust key detection for Gemini
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                 (process as any).env?.GEMINI_API_KEY || 
                 (process as any).env?.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("TODO") || apiKey.length < 10) {
    console.error("Invalid GEMINI_API_KEY detected");
    throw new Error("GEMINI_API_KEY is missing or invalid. Please set it in Settings.");
  }
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
}

// Cache for search results to enable "instant" loading for repeated queries
const searchCache = new Map<string, { products: Product[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function searchProducts(query: string, page: number = 1): Promise<{ text: string; products: Product[]; isRealTime: boolean; error?: string }> {
  const serperKey = process.env.VITE_SERPER_API_KEY;
  if (!serperKey || serperKey === "" || serperKey.includes('TODO')) {
    return { text: "Key missing", products: [], isRealTime: true, error: "MISSING_KEY" };
  }

  const cacheKey = `${query.toLowerCase()}-${page}`;
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return { text: `Found ${cached.products.length} results (cached)`, products: cached.products, isRealTime: true };
  }

  try {
    const numToFetch = page === 1 ? 5 : 10;
    // Optimized for India region and maximum speed
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
      const mainImage = item.image || item.thumbnail || "";
      const thumbImage = item.thumbnail || item.image || "";
      
      return {
        id: `s-${page}-${index}-${Date.now()}`,
        name: item.title,
        description: item.snippet || item.title,
        price: parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0,
        originalPrice: item.oldPrice ? parseFloat(String(item.oldPrice).replace(/[^0-9.]/g, '')) : undefined,
        currency: '₹',
        imageUrl: mainImage,
        thumbnailUrl: thumbImage,
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
      text: products.length > 0 ? `Found ${products.length} results` : "No results found.", 
      products, 
      isRealTime: true 
    };
  } catch (e) {
    return { text: "Search failed.", products: [], isRealTime: true, error: "FAILED" };
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

export async function chatWithAgent(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  try {
    const chat = getAI().chats.create({
      model: "gemini-flash-latest",
      config: {
        systemInstruction: "You are a global e-commerce shopping agent. You help users find products, manage their cart, and proceed to checkout. Be helpful, professional, and concise. If the user asks to search for something, use the searchProducts tool logic (though here you are in a chat context, so just respond naturally).",
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      },
      history: history
    });

    const response = await chat.sendMessage({ message });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (e) {
    console.error("Chat Error:", e);
    return "I'm sorry, I'm having trouble responding right now.";
  }
}
