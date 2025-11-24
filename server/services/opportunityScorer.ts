/**
 * Opportunity Scorer Service
 * 
 * Combines multiple signals into a unified 0-100 score:
 * - Relevance (30%): How related the market is to the event
 * - Velocity (25%): How fast the news is spreading
 * - Liquidity (20%): Market depth in USD
 * - Urgency (15%): Time until market closes
 * - Momentum (10%): 1-hour price movement
 */

export interface OpportunityScore {
  totalScore: number;
  breakdown: {
    relevance: number;
    velocity: number;
    liquidity: number;
    urgency: number;
    momentum: number;
  };
  reason: string;
}

/**
 * Calculate comprehensive opportunity score
 */
export function scoreOpportunity(params: {
  relevance: number; // 0-100
  velocity: number; // 0-100
  liquidity: number; // USD amount
  closeTime?: Date | null;
  momentum1h?: number; // Price change in last hour (-1 to 1)
}): OpportunityScore {
  const { relevance, velocity, liquidity, closeTime, momentum1h } = params;

  // Normalize each component to 0-100
  const relScore = clamp(relevance, 0, 100);
  const velScore = clamp(velocity, 0, 100);
  const liqScore = normalizeLiquidity(liquidity);
  const urgScore = calculateUrgencyScore(closeTime);
  const momScore = normalizeMomentum(momentum1h);

  // Weighted average
  const weights = {
    relevance: 30,
    velocity: 25,
    liquidity: 20,
    urgency: 15,
    momentum: 10,
  };

  const total =
    (relScore * weights.relevance +
      velScore * weights.velocity +
      liqScore * weights.liquidity +
      urgScore * weights.urgency +
      momScore * weights.momentum) /
    100;

  const breakdown = {
    relevance: Math.round(relScore),
    velocity: Math.round(velScore),
    liquidity: Math.round(liqScore),
    urgency: Math.round(urgScore),
    momentum: Math.round(momScore),
  };

  const reason = composeReason(breakdown);

  return {
    totalScore: Math.round(total),
    breakdown,
    reason,
  };
}

/**
 * Convert liquidity (USD) to 0-100 score
 * - $0 -> 0
 * - $100 -> ~10
 * - $500 -> ~50
 * - $1000+ -> 100
 */
function normalizeLiquidity(liquidity: number): number {
  const liq = Math.max(0, liquidity);
  return clamp((liq / 1000) * 100, 0, 100);
}

/**
 * Calculate urgency score based on time until close
 * - >7 days: 0-20
 * - 3-7 days: 20-40
 * - 1-3 days: 40-60
 * - <24h: 60-80
 * - <6h: 80-100
 */
function calculateUrgencyScore(closeTime?: Date | null): number {
  if (!closeTime) return 0;

  const now = Date.now();
  const close = closeTime.getTime();
  const hoursUntilClose = (close - now) / (1000 * 60 * 60);

  if (hoursUntilClose <= 0) return 0; // Already closed
  if (hoursUntilClose < 6) return 90;
  if (hoursUntilClose < 24) return 70;
  if (hoursUntilClose < 72) return 50;
  if (hoursUntilClose < 168) return 30;
  return 10;
}

/**
 * Normalize 1-hour price momentum to 0-100
 * Uses absolute magnitude (direction shown in UI separately)
 * - 0.0 -> 0
 * - 0.05 (5pp) -> ~50
 * - 0.10+ -> 100
 */
function normalizeMomentum(delta?: number): number {
  if (delta === undefined || delta === null) return 0;
  const absDelta = Math.abs(delta);
  return clamp(absDelta * 1000, 0, 100);
}

/**
 * Create a short reason phrase highlighting strongest contributors
 */
function composeReason(scores: {
  relevance: number;
  velocity: number;
  liquidity: number;
  urgency: number;
  momentum: number;
}): string {
  const reasons: string[] = [];

  if (scores.relevance >= 70) reasons.push("high relevance");
  if (scores.velocity >= 70) reasons.push("breaking news");
  if (scores.liquidity >= 70) reasons.push("strong liquidity");
  if (scores.urgency >= 70) reasons.push("closing soon");
  if (scores.momentum >= 70) reasons.push("strong momentum");

  if (reasons.length === 0) return "best current opportunity";
  return reasons.join(", ");
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get velocity chip label for display
 */
export function getVelocityChip(velocity: number): string {
  if (velocity >= 80) return "🔥 Breaking";
  if (velocity >= 60) return "⚡ Trending";
  if (velocity >= 40) return "📈 Rising";
  return "💡 Emerging";
}
