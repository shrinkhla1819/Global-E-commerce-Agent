# Global Shopping Agent 🛍️

A powerful, real-time e-commerce assistant powered by **Gemini AI** with **Google Search Grounding**. This agent finds real products from top global retailers with a strict ranking system and iterative search capabilities.

## 🌟 Purpose
The Global Shopping Agent is designed to simplify the online shopping experience. Instead of manually browsing multiple tabs, users can simply describe what they want. The agent:
- Fetches **real-time products** with current prices and images.
- Follows a **strict ranking system**.
- Supports **iterative loading** to discover more options from other global sites.
- Provides **price comparisons** across different retailers.
- Features **voice search** for a hands-free experience.

## 🛠️ Tech Stack
- **Frontend**: React 19 + Vite (Type-safe UI)
- **Backend**: Express.js (Proxy for Chromium/Playwright)
- **Automation**: Playwright (Headless Browser)
- **AI Engine**: Google Gemini API
- **Search API**: Serper.dev (Google Shopping scraper)

## 🚀 Local Setup Instructions

Follow these steps to get the project running on your local machine.

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Installation
```bash
npm install
npx playwright install chromium
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add your API keys:
```env
GEMINI_API_KEY=your_google_ai_studio_api_key_here
VITE_SERPER_API_KEY=your_serper_api_key_here
```
*You can get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).* 
*For real-time shopping results, get a Serper API key from [Serper.dev](https://serper.dev/).*

### 4. Run the Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## 📖 How to Use
1. **Search**: Type or use the microphone to say what you're looking for.
2. **Browse**: View the top 6 results ranked strictly by your preferred stores.
3. **Load More**: Click "Load More Options" to fetch the next 10 results from other global retailers.
4. **Compare**: Click "Compare Prices" on any product card to see live prices from other stores.
5. **Cart**: Add items to your cart and proceed to a simulated checkout.