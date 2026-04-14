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

const PRODUCT_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      price: { type: Type.NUMBER },
      originalPrice: { type: Type.NUMBER, description: "The price before discount, if available." },
      discount: { type: Type.STRING, description: "The discount percentage or amount, e.g., '56% off'." },
      currency: { type: Type.STRING },
      imageUrl: { type: Type.STRING },
      sourceUrl: { type: Type.STRING },
      sourceName: { type: Type.STRING },
      brand: { type: Type.STRING },
      rating: { type: Type.NUMBER },
      reviewCount: { type: Type.NUMBER, description: "Number of customer reviews." },
    },
    required: ["id", "name", "description", "price", "currency", "imageUrl", "sourceUrl", "sourceName"],
  },
};

// Cache for search results to enable "instant" loading for repeated queries
const searchCache = new Map<string, { products: Product[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function searchProducts(query: string, page: number = 1, useRealTime: boolean = true): Promise<{ text: string; products: Product[]; isRealTime: boolean; error?: string }> {
  // Robust key detection for Gemini
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                 (process as any).env?.GEMINI_API_KEY || 
                 (process as any).env?.VITE_GEMINI_API_KEY;
  
  // Robust Serper key detection
  const serperKey = (import.meta as any).env?.VITE_SERPER_API_KEY || 
                    (process as any).env?.VITE_SERPER_API_KEY || 
                    (process as any).env?.SERPER_API_KEY;

  console.log("Serper Key Detected:", serperKey ? `YES (${serperKey.substring(0, 4)}...)` : "NO");
  console.log("Gemini Key Detected:", apiKey ? `YES (${apiKey.substring(0, 4)}...)` : "NO");

  if (!apiKey || apiKey.includes('TODO')) {
    return { text: "API Key missing", products: [], isRealTime: false, error: "MISSING_API_KEY" };
  }

  const cacheKey = `${query.toLowerCase()}-${page}`;
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return { text: `Found ${cached.products.length} results (cached)`, products: cached.products, isRealTime: true };
  }

  if (useRealTime && serperKey && !serperKey.includes('TODO') && serperKey !== "undefined") {
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        const numToFetch = page === 1 ? 5 : 10;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); 

        const serperResponse = await fetch("https://google.serper.dev/shopping", {
          method: "POST",
          headers: { 
            "X-API-KEY": serperKey, 
            "Content-Type": "application/json" 
          },
          signal: controller.signal,
          body: JSON.stringify({ q: query, gl: "in", hl: "en", num: numToFetch, page: page }),
        });

        clearTimeout(timeoutId);
        
        if (!serperResponse.ok) {
          const errorText = await serperResponse.text();
          throw new Error(`Serper API error: ${serperResponse.status} ${errorText}`);
        }

        const data = await serperResponse.json();
        
        if (data.shopping && data.shopping.length > 0) {
          const products: Product[] = data.shopping.slice(0, numToFetch).map((item: any, index: number) => ({
            id: `s-${page}-${index}-${Date.now()}`,
            name: item.title,
            description: item.snippet || item.title,
            price: parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0,
            originalPrice: item.oldPrice ? parseFloat(String(item.oldPrice).replace(/[^0-9.]/g, '')) : undefined,
            currency: '₹',
            imageUrl: item.image || item.thumbnail || "",
            thumbnailUrl: item.thumbnail || item.image || "",
            sourceUrl: item.link,
            sourceName: item.source,
            brand: item.brand || item.source,
            rating: item.rating,
            reviewCount: item.reviews,
            category: 'Search Result'
          }));

          searchCache.set(cacheKey, { products, timestamp: Date.now() });
          return { text: `Found ${products.length} real-time results`, products, isRealTime: true };
        }
        break; // Exit loop if successful but no products
      } catch (e) {
        attempts++;
        console.error(`Serper attempt ${attempts} failed:`, e);
        if (attempts === maxAttempts) break;
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
      }
    }
  }
 else {
    console.warn("Serper API key not found or invalid. Falling back to AI.");
  }

  // --- FAST AI FALLBACK (No Tools, No Search) ---
  try {
    const genAI = getAI();
    const result = await genAI.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: [{ role: "user", parts: [{ text: `The user is looking for: ${query}. Provide a list of 10 products with estimated prices in INR. Format as JSON matching this schema: ${JSON.stringify(PRODUCT_SCHEMA)}` }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const data = JSON.parse(result.text || "[]");
    return {
      text: `I found some products based on my knowledge for "${query}". (Real-time search was unavailable)`,
      products: data,
      isRealTime: false
    };
  } catch (e) {
    console.error("Final Fallback Error:", e);
    return {
      text: "I'm sorry, I'm having trouble finding products right now. Please try again in a moment.",
      products: [],
      isRealTime: false
    };
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
