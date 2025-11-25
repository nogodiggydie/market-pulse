import { getCachedMarkets, setCachedMarkets } from "./marketCache";
import { fetchAllMarkets } from "./marketAggregator";
import { findMarketsForEvent } from "./marketMatcher";

/**
 * Warm cache for a single event by pre-populating matched markets
 * Returns true if warming was successful, false if already cached or failed
 */
export async function warmCacheForEvent(
  title: string,
  keywords: string[],
  limit: number = 3
): Promise<boolean> {
  try {
    // Check if already cached
    const cached = await getCachedMarkets(title, keywords);
    if (cached) {
      console.log(`[Cache Warming] SKIP - already cached: "${title}"`);
      return false;
    }

    console.log(`[Cache Warming] START - warming cache for: "${title}"`);
    const startTime = Date.now();

    // Fetch and match markets
    const markets = await fetchAllMarkets(150);
    const matchedMarkets = await findMarketsForEvent(
      title,
      keywords,
      markets,
      limit
    );

    // Store in cache
    await setCachedMarkets(title, keywords, matchedMarkets);

    const duration = Date.now() - startTime;
    console.log(
      `[Cache Warming] COMPLETE - warmed "${title}" in ${duration}ms (${matchedMarkets.length} markets)`
    );

    return true;
  } catch (error) {
    console.error(`[Cache Warming] ERROR - failed to warm "${title}":`, error);
    return false;
  }
}

/**
 * Warm cache for multiple high-velocity events
 * Processes events sequentially to avoid overwhelming the LLM API
 */
export async function warmCacheForHighVelocityEvents(
  events: Array<{ title: string; keywords: string[]; velocity: number }>,
  velocityThreshold: number = 60,
  limit: number = 3
): Promise<{ warmed: number; skipped: number; failed: number }> {
  const highVelocityEvents = events.filter(
    (event) => event.velocity >= velocityThreshold
  );

  if (highVelocityEvents.length === 0) {
    console.log(
      `[Cache Warming] No high-velocity events (>=${velocityThreshold}) to warm`
    );
    return { warmed: 0, skipped: 0, failed: 0 };
  }

  console.log(
    `[Cache Warming] Starting batch warming for ${highVelocityEvents.length} high-velocity events (>=${velocityThreshold})`
  );

  let warmed = 0;
  let skipped = 0;
  let failed = 0;

  for (const event of highVelocityEvents) {
    const result = await warmCacheForEvent(event.title, event.keywords, limit);

    if (result === true) {
      warmed++;
    } else if (result === false) {
      // Could be skipped (already cached) or failed
      const cached = await getCachedMarkets(event.title, event.keywords);
      if (cached) {
        skipped++;
      } else {
        failed++;
      }
    }

    // Add small delay between events to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(
    `[Cache Warming] Batch complete - warmed: ${warmed}, skipped: ${skipped}, failed: ${failed}`
  );

  return { warmed, skipped, failed };
}

/**
 * Background job to warm cache for high-velocity events
 * Should be called periodically (e.g., every 10 minutes)
 */
export async function runCacheWarmingJob(
  fetchEvents: () => Promise<
    Array<{ title: string; keywords: string[]; velocity: number }>
  >,
  velocityThreshold: number = 60
): Promise<void> {
  try {
    console.log("[Cache Warming] Running scheduled warming job...");
    const events = await fetchEvents();
    await warmCacheForHighVelocityEvents(events, velocityThreshold);
  } catch (error) {
    console.error("[Cache Warming] Job failed:", error);
  }
}
