import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE, getLoginUrl } from "@/const";
import { toast } from "sonner";

const tiers = [
  {
    name: "Free",
    tier: "free" as const,
    price: 0,
    description: "Get started with basic market intelligence",
    icon: Sparkles,
    iconColor: "text-muted-foreground",
    features: [
      "View top 5 trending news events",
      "Basic market matching",
      "Limited to 10 views per day",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    tier: "pro" as const,
    price: 29,
    description: "Full access to market intelligence platform",
    icon: Zap,
    iconColor: "text-primary",
    features: [
      "Unlimited news feed access",
      "Full dashboard with all features",
      "Market of the Hour insights",
      "Email alerts for top opportunities",
      "Real-time market matching",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Premium",
    tier: "premium" as const,
    price: 99,
    description: "Everything in Pro plus API access",
    icon: Crown,
    iconColor: "text-accent",
    features: [
      "Everything in Pro",
      "API access for integration",
      "Priority support",
      "Custom alerts and filters",
      "Streaming dashboard access",
      "Advanced analytics",
    ],
    cta: "Start Premium Trial",
    popular: false,
  },
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation();

  const handleSubscribe = async (tier: "free" | "pro" | "premium") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (tier === "free") {
      toast.info("You're already on the free tier!");
      return;
    }

    try {
      const { url } = await createCheckoutMutation.mutateAsync({ tier });
      toast.success("Redirecting to checkout...");
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Failed to create checkout session");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                <Zap className="h-4 w-4 text-background" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-chart-4 to-accent bg-clip-text text-transparent">
                {APP_TITLE}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="default">Dashboard</Button>
              </Link>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost">Sign In</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button variant="default">Get Started</Button>
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-sm font-medium text-primary shadow-lg shadow-primary/20">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              Simple, Transparent Pricing
            </div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight mb-6">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade as you grow. All plans include access to our core features.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isCurrentTier = user?.subscriptionTier === tier.tier;

              return (
                <Card
                  key={tier.name}
                  className={`relative p-8 ${
                    tier.popular
                      ? "border-primary/40 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl shadow-primary/10"
                      : "border-border/40"
                  }`}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-primary/40">
                      Most Popular
                    </Badge>
                  )}

                  <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${
                      tier.popular ? "from-primary to-chart-4" : "from-muted to-muted-foreground/20"
                    } mb-4`}>
                      <Icon className={`h-6 w-6 ${tier.popular ? "text-background" : tier.iconColor}`} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">${tier.price}</span>
                      {tier.price > 0 && <span className="text-muted-foreground">/month</span>}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(tier.tier)}
                    disabled={isCurrentTier || createCheckoutMutation.isPending}
                  >
                    {isCurrentTier ? "Current Plan" : tier.cta}
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* FAQ or Additional Info */}
          <div className="mt-20 text-center">
            <p className="text-muted-foreground">
              All plans include a 7-day free trial. Cancel anytime, no questions asked.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Need a custom plan? <a href="#" className="text-primary hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
