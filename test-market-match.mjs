// Node 18+ has built-in fetch

const title = "Will Bitcoin's Dive Threaten Michael Saylor's Strategy";
const keywords = ["bitcoin", "dive", "threaten", "michael", "saylor"];

const input = {
  json: {
    title,
    keywords,
    limit: 5
  }
};

const url = `https://3000-iz7ghg93uv98hkddrsmfw-907fd980.manusvm.computer/api/trpc/news.matchEvent?input=${encodeURIComponent(JSON.stringify(input))}`;

console.log('Testing matchEvent API...');
console.log('URL:', url);

const response = await fetch(url);
const data = await response.json();

console.log('\n=== API Response ===');
console.log(JSON.stringify(data, null, 2));

if (data.result?.data?.json) {
  console.log('\n=== Markets Found ===');
  console.log('Count:', data.result.data.json.length);
  
  data.result.data.json.forEach((match, i) => {
    console.log(`\n[${i + 1}] ${match.market.question}`);
    console.log(`    Venue: ${match.market.venue}`);
    console.log(`    Relevance: ${match.relevanceScore}%`);
    console.log(`    Probability: ${match.market.probability}`);
  });
}
