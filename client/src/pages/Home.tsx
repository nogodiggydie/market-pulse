import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Zap, Target, BarChart3, Clock, Sparkles } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { ConnectWallet } from "@/components/ConnectWallet";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <Zap className="h-5 w-5 text-background" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-chart-4 to-accent bg-clip-text text-transparent">
              {APP_TITLE}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ConnectWallet />
            {isAuthenticated ? (
              <>
                <Link href="/positions">
                  <Button variant="ghost" size="sm">My Positions</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="default">Dashboard</Button>
                </Link>
              </>
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
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-0 w-[700px] h-[700px] bg-accent/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-chart-3/10 rounded-full blur-3xl" />
        </div>

        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-sm font-medium text-primary shadow-lg shadow-primary/20">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              AI-Powered Market Intelligence
            </div>
            
            <h1 className="text-6xl font-bold leading-tight tracking-tight mb-6">
              <span className="bg-gradient-to-r from-foreground via-primary to-chart-4 bg-clip-text text-transparent">
                Spot Value Before
              </span>
              <br />
              <span className="bg-gradient-to-r from-accent via-chart-2 to-primary bg-clip-text text-transparent">
                The Crowd Does
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Real-time news intelligence meets prediction markets. Our AI analyzes 97,000+ markets across Kalshi, Polymarket, and Manifold to find opportunities as events unfold.
            </p>

            <div className="flex items-center justify-center gap-4">
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  View Live Dashboard
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex items-center justify-center gap-12 text-sm text-muted-foreground">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary">97K+</div>
                <div>Markets Tracked</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-accent">3</div>
                <div>Major Venues</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-chart-3">24/7</div>
                <div>Real-Time Updates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border/40">
        <div className="container">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-4 py-2 text-sm font-medium text-accent mb-4 shadow-lg shadow-accent/20">
              <div className="h-2 w-2 rounded-full bg-accent"></div>
              FEATURES
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to Win
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools and insights to help you identify and act on market opportunities faster than anyone else.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-card/50 backdrop-blur border-border/40 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-semibold mb-2">
                News-to-Market Matching
              </h3>
              <p className="text-muted-foreground">
                Our AI instantly connects breaking news to relevant prediction markets, showing you exactly where the action is.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-border/40 hover:border-accent/40 transition-all hover:shadow-lg hover:shadow-accent/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent mb-4">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-semibold mb-2">
                Multi-Factor Scoring
              </h3>
              <p className="text-muted-foreground">
                Every opportunity is scored on relevance, velocity, liquidity, urgency, and momentum—so you know what matters most.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-border/40 hover:border-chart-3/40 transition-all hover:shadow-lg hover:shadow-chart-3/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3 mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-semibold mb-2">
                Market of the Hour
              </h3>
              <p className="text-muted-foreground">
                AI-curated highlights of the most interesting markets right now, updated every hour with fresh insights.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-border/40 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-semibold mb-2">
                Real-Time Streaming
              </h3>
              <p className="text-muted-foreground">
                Live dashboard with auto-updating feeds, perfect for monitoring markets or streaming on Twitch/YouTube.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-border/40 hover:border-accent/40 transition-all hover:shadow-lg hover:shadow-accent/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-semibold mb-2">
                Velocity Tracking
              </h3>
              <p className="text-muted-foreground">
                See how fast news is spreading and which stories have the most momentum before they hit mainstream.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-border/40 hover:border-chart-3/40 transition-all hover:shadow-lg hover:shadow-chart-3/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3 mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-semibold mb-2">
                Cross-Platform Intelligence
              </h3>
              <p className="text-muted-foreground">
                Track the same events across Kalshi, Polymarket, and Manifold to spot consensus and divergence.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/40">
        <div className="container">
          <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-primary/5">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzBERjlGRiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
            <div className="relative p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join traders who are already using Probability Exchange to stay ahead of the market.
              </p>
              <div className="flex items-center justify-center gap-4">
                <a href={getLoginUrl()}>
                  <Button size="lg" className="gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline">
                    Explore Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <Zap className="h-3 w-3 text-background" />
              </div>
              <span className="font-semibold">{APP_TITLE}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 {APP_TITLE}. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
