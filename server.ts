import express from "express";
import { createServer as createViteServer } from "vite";
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Interaction API using Playwright
  app.post("/api/interact", async (req, res) => {
    const { url, action, options } = req.body;
    
    if (!url) return res.status(400).json({ error: "Missing URL" });

    console.log(`[Interaction] Action: ${action} on ${url}`);

    let browser;
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
      });
      
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      let result = { status: "success", message: "", screenshot: "" };

      if (action === "view") {
        const title = await page.title();
        result.message = `Viewing: ${title}`;
      } else if (action === "add_to_cart") {
        // Try to find common "Add to Cart" or "Buy Now" buttons
        const buttonSelectors = [
          '#add-to-cart-button',
          '.add-to-cart',
          'button:has-text("Add to Cart")',
          'button:has-text("Add to Bag")',
          '.btn-add-to-cart'
        ];
        
        let clicked = false;
        for (const selector of buttonSelectors) {
          try {
            const btn = await page.$(selector);
            if (btn) {
              await btn.click();
              clicked = true;
              break;
            }
          } catch (e) {}
        }
        
        result.message = clicked ? "Successfully clicked Add to Cart" : "Add to Cart button not found, please check manually.";
      } else if (action === "checkout") {
        result.message = "Navigating to checkout page...";
      }

      // Take a small screenshot to confirm
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 50 });
      result.screenshot = `data:image/jpeg;base64,${screenshot.toString('base64')}`;

      await browser.close();
      res.json(result);
    } catch (error) {
      console.error("Interaction error:", error);
      if (browser) await browser.close();
      res.status(500).json({ error: "Interaction failed", details: String(error) });
    }
  });

  // Search/Scrape API (Legacy or Backup)
  app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    const pageNum = parseInt(req.query.page as string || "1");
    
    if (!query) return res.status(400).json({ error: "Missing query" });

    console.log(`[Scraper] Searching for: ${query} (Page ${pageNum})`);

    let browser;
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
      });
      
      const page = await context.newPage();
      
      // Target Amazon India for real-time shopping data
      // We use a broader search if needed, but Amazon is reliable for sarees/electronics.
      const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(query)}&page=${pageNum}`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });

      // Wait for results
      await page.waitForSelector('.s-result-item', { timeout: 15000 }).catch(() => {
        console.log("Timeout waiting for items, trying to proceed anyway");
      });

      const products = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[data-component-type="s-search-result"]'));
        return items.map((item, index) => {
          const titleEl = item.querySelector('h2 a span');
          const priceEl = item.querySelector('.a-price-whole');
          const imgEl = item.querySelector('img.s-image');
          const linkEl = item.querySelector('h2 a');
          const ratingEl = item.querySelector('.a-icon-alt');
          const reviewsEl = item.querySelector('.a-size-base.s-underline-text');

          return {
            id: `scrape-${Date.now()}-${index}`,
            name: titleEl?.textContent?.trim() || 'Product',
            price: parseFloat(priceEl?.textContent?.replace(/[^0-9.]/g, '') || '0'),
            currency: '₹',
            imageUrl: imgEl?.getAttribute('src') || '',
            thumbnailUrl: imgEl?.getAttribute('src') || '',
            sourceUrl: linkEl ? 'https://www.amazon.in' + linkEl.getAttribute('href') : '',
            sourceName: 'Amazon.in',
            rating: parseFloat(ratingEl?.textContent?.split(' ')[0] || '0'),
            reviewCount: parseInt(reviewsEl?.textContent?.replace(/[^0-9]/g, '') || '0'),
            description: titleEl?.textContent?.trim() || ''
          };
        }).filter(p => p.name !== 'Product' && p.imageUrl);
      });

      console.log(`[Scraper] Found ${products.length} products`);
      
      await browser.close();
      res.json({ products: products.slice(0, pageNum === 1 ? 5 : 10) });
    } catch (error) {
      console.error("Scraping error:", error);
      if (browser) await browser.close();
      res.status(500).json({ error: "Failed to scrape products", details: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
