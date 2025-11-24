/**
 * Subscription products and pricing for Market Pulse
 * These should match the products created in Stripe Dashboard
 */

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium',
} as const;

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];

export interface SubscriptionProduct {
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: number; // in USD
  priceId?: string; // Stripe Price ID (set after creating in Stripe)
  features: string[];
  limits: {
    newsEventsPerDay: number | null; // null = unlimited
    dashboardAccess: boolean;
    marketOfTheHour: boolean;
    apiAccess: boolean;
    streamingDashboard: boolean;
    emailAlerts: boolean;
    prioritySupport: boolean;
  };
}

export const PRODUCTS: Record<SubscriptionTier, SubscriptionProduct> = {
  free: {
    tier: 'free',
    name: 'Free',
    description: 'Get started with basic market intelligence',
    price: 0,
    features: [
      'View top 5 trending news events',
      'Basic market matching',
      'Limited to 10 views per day',
    ],
    limits: {
      newsEventsPerDay: 10,
      dashboardAccess: false,
      marketOfTheHour: false,
      apiAccess: false,
      streamingDashboard: false,
      emailAlerts: false,
      prioritySupport: false,
    },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    description: 'Full access to market intelligence platform',
    price: 29,
    // Set this after creating the price in Stripe Dashboard
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: [
      'Unlimited news feed access',
      'Full dashboard with all features',
      'Market of the Hour insights',
      'Email alerts for top opportunities',
      'Real-time market matching',
    ],
    limits: {
      newsEventsPerDay: null,
      dashboardAccess: true,
      marketOfTheHour: true,
      apiAccess: false,
      streamingDashboard: false,
      emailAlerts: true,
      prioritySupport: false,
    },
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    description: 'Everything in Pro plus API access and streaming',
    price: 99,
    // Set this after creating the price in Stripe Dashboard
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
    features: [
      'Everything in Pro',
      'API access for integration',
      'Priority support',
      'Custom alerts and filters',
      'Streaming dashboard access',
      'Advanced analytics',
    ],
    limits: {
      newsEventsPerDay: null,
      dashboardAccess: true,
      marketOfTheHour: true,
      apiAccess: true,
      streamingDashboard: true,
      emailAlerts: true,
      prioritySupport: true,
    },
  },
};

/**
 * Check if a user has access to a specific feature based on their tier
 */
export function hasFeatureAccess(
  userTier: SubscriptionTier,
  feature: keyof SubscriptionProduct['limits']
): boolean {
  return PRODUCTS[userTier].limits[feature] === true;
}

/**
 * Get the daily news event limit for a tier
 */
export function getNewsEventLimit(userTier: SubscriptionTier): number | null {
  return PRODUCTS[userTier].limits.newsEventsPerDay;
}
