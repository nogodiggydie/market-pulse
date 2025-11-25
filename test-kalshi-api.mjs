// Test Kalshi API directly
const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

async function testKalshiAPI() {
  try {
    console.log("Testing Kalshi API...\n");
    
    // Test 1: Fetch markets
    console.log("1. Fetching first 10 open markets...");
    const response = await fetch(
      `${KALSHI_API_BASE}/markets?limit=10&status=open`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error: ${response.status} - ${errorText}`);
      return;
    }

    const data = await response.json();
    const markets = data.markets || [];
    
    console.log(`✅ Found ${markets.length} markets\n`);
    
    // Display first 5 markets
    console.log("Sample markets:");
    markets.slice(0, 5).forEach((market, i) => {
      console.log(`\n${i + 1}. ${market.title}`);
      console.log(`   Ticker: ${market.ticker}`);
      console.log(`   Category: ${market.category}`);
      console.log(`   Status: ${market.status}`);
    });
    
    // Test 2: Search for Nvidia
    console.log("\n\n2. Searching for 'nvidia' markets...");
    const nvidiaMarkets = markets.filter(m => 
      m.title.toLowerCase().includes('nvidia') ||
      m.subtitle?.toLowerCase().includes('nvidia')
    );
    
    console.log(`✅ Found ${nvidiaMarkets.length} Nvidia-related markets`);
    nvidiaMarkets.forEach((market, i) => {
      console.log(`\n${i + 1}. ${market.title}`);
      console.log(`   ${market.subtitle || 'No subtitle'}`);
    });
    
  } catch (error) {
    console.error("❌ Failed to test Kalshi API:", error);
  }
}

testKalshiAPI();
