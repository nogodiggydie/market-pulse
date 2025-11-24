/**
 * News Event Detection Service
 * 
 * Fetches trending events from NewsAPI or returns demo data as fallback.
 * Scores events by velocity (how fast they're spreading), impact, and category.
 */

export interface NewsEvent {
  title: string;
  description: string;
  keywords: string[];
  source: string;
  velocity: number; // 0-100 (how fast it's spreading)
  category: string;
  publishedAt: Date;
  url?: string;
}

// Demo/fallback events for when NewsAPI is not available
const DEMO_EVENTS: NewsEvent[] = [
  {
    title: "Federal Reserve Signals Rate Cut Potential",
    description: "Fed Chair hints at possible rate cuts in Q2 2025 amid cooling inflation",
    keywords: ["federal", "reserve", "interest", "rates", "inflation", "economy"],
    source: "demo",
    velocity: 85,
    category: "economy",
    publishedAt: new Date(Date.now() - 15 * 60 * 1000),
    url: "https://example.com/fed-rates",
  },
  {
    title: "Bitcoin Surges Past $98,000 on ETF Inflows",
    description: "BTC hits new all-time high as institutional demand continues",
    keywords: ["bitcoin", "cryptocurrency", "price", "surge"],
    source: "demo",
    velocity: 92,
    category: "crypto",
    publishedAt: new Date(Date.now() - 8 * 60 * 1000),
    url: "https://example.com/btc-surge",
  },
  {
    title: "Major Tech Layoffs at Leading AI Company",
    description: "AI startup announces 20% workforce reduction amid restructuring",
    keywords: ["tech", "layoffs", "jobs", "startup", "economy"],
    source: "demo",
    velocity: 73,
    category: "tech",
    publishedAt: new Date(Date.now() - 22 * 60 * 1000),
    url: "https://example.com/tech-layoffs",
  },
  {
    title: "Presidential Election Poll Shows Tight Race",
    description: "Latest polling data indicates neck-and-neck competition in key swing states",
    keywords: ["election", "president", "polling", "politics"],
    source: "demo",
    velocity: 68,
    category: "politics",
    publishedAt: new Date(Date.now() - 30 * 60 * 1000),
    url: "https://example.com/election-poll",
  },
  {
    title: "Ethereum Upgrade Completes Successfully",
    description: "Network transition brings improved scalability and reduced gas fees",
    keywords: ["ethereum", "crypto", "blockchain", "upgrade"],
    source: "demo",
    velocity: 79,
    category: "crypto",
    publishedAt: new Date(Date.now() - 12 * 60 * 1000),
    url: "https://example.com/eth-upgrade",
  },
];

/**
 * Fetch trending events from NewsAPI or return demo events as fallback
 */
export async function fetchTrendingEvents(limit: number = 10, newsApiKey?: string): Promise<NewsEvent[]> {
  // Try NewsAPI if key is configured
  if (newsApiKey) {
    try {
      const events = await fetchFromNewsAPI(limit, newsApiKey);
      if (events.length > 0) {
        return events;
      }
    } catch (error) {
      console.warn("NewsAPI fetch failed, using demo data:", error);
    }
  }

  // Fallback to demo events
  console.log("Using demo events (configure NEWSAPI_KEY for real data)");
  return DEMO_EVENTS.sort((a, b) => b.velocity - a.velocity).slice(0, limit);
}

/**
 * Fetch events from NewsAPI (top headlines)
 */
async function fetchFromNewsAPI(limit: number, apiKey: string): Promise<NewsEvent[]> {
  const url = "https://newsapi.org/v2/top-headlines";
  const params = new URLSearchParams({
    apiKey,
    language: "en",
    pageSize: limit.toString(),
    category: "business", // Focus on business/economy for betting markets
  });

  const response = await fetch(`${url}?${params}`);

  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "ok") {
    throw new Error(`NewsAPI returned: ${data.message || "unknown error"}`);
  }

  const events: NewsEvent[] = [];
  for (const article of data.articles || []) {
    // Extract keywords from title and description
    const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();
    const keywords = extractKeywords(text);

    // Calculate velocity (simple heuristic based on publishedAt)
    const publishedAt = new Date(article.publishedAt);
    const timeDiffMinutes = (Date.now() - publishedAt.getTime()) / (1000 * 60);
    const velocity = Math.max(0, Math.min(100, 100 - (timeDiffMinutes / 120) * 100)); // Decay over 2 hours

    // Categorize based on keywords
    const category = categorizeEvent(keywords);

    events.push({
      title: article.title || "",
      description: article.description || "",
      keywords,
      source: "newsapi",
      velocity: Math.round(velocity),
      category,
      publishedAt,
      url: article.url,
    });
  }

  return events.sort((a, b) => b.velocity - a.velocity);
}

/**
 * Extract important keywords from text (simple version)
 */
function extractKeywords(text: string): string[] {
  // Common words to exclude
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that",
    "have",
    "been",
    "will",
    "their",
    "what",
    "which",
    "when",
    "where",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[,.\n]/g, "")
    .split(/\s+/);
  const keywords = words.filter((w) => w.length > 3 && !stopWords.has(w));

  // Return unique keywords, limited to top 10
  return Array.from(new Set(keywords)).slice(0, 10);
}

/**
 * Categorize event based on keywords
 */
function categorizeEvent(keywords: string[]): string {
  const cryptoKeywords = new Set(["bitcoin", "ethereum", "crypto", "cryptocurrency", "blockchain"]);
  const politicsKeywords = new Set(["election", "president", "congress", "senate", "government", "policy", "vote"]);
  const economyKeywords = new Set(["economy", "federal", "reserve", "inflation", "rates", "jobs"]);
  const techKeywords = new Set(["tech", "startup", "silicon", "valley", "software", "google", "apple"]);

  const keywordSet = new Set(keywords);

  if (Array.from(cryptoKeywords).some((k) => keywordSet.has(k))) return "crypto";
  if (Array.from(politicsKeywords).some((k) => keywordSet.has(k))) return "politics";
  if (Array.from(economyKeywords).some((k) => keywordSet.has(k))) return "economy";
  if (Array.from(techKeywords).some((k) => keywordSet.has(k))) return "tech";

  return "general";
}
