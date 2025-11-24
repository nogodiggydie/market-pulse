import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Zap, 
  ExternalLink,
  Filter,
  RefreshCw,
  Sparkles,
  Activity,
  BarChart3,
  PieChart,
  Target
} from "lucide-react";
import { APP_TITLE } from "@/const";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { TradeModal } from "@/components/TradeModal";
import { ConnectWallet } from "@/components/ConnectWallet";

export default function DashboardEnhanced() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch trending news fast
  const { data: newsEvents, isLoading: newsLoading, refetch: refetchNews } = trpc.news.trending.useQuery({ limit: 20 });
  
  // Fetch matched markets for top 3 (slower)
  const { data: opportunities, isLoading: oppsLoading } = trpc.news.opportunities.useQuery({ limit: 3 });

  const categories = ["all", "crypto", "politics", "economy", "tech"];
  
  // Combine news with opportunities
  const allEvents = newsEvents || [];
  const opportunityMap = new Map(
    opportunities?.map((opp: any) => [opp.event.title, opp.markets]) || []
  );
  
  const filteredEvents = selectedCategory && selectedCategory !== "all"
    ? allEvents.filter(e => e.category === selectedCategory)
    : allEvents;

  // Calculate stats
  const stats = useMemo(() => {
    if (!allEvents.length) return null;
    
    const avgVelocity = Math.round(
      allEvents.reduce((sum, e) => sum + e.velocity, 0) / allEvents.length
    );
    
    const categoryCount: Record<string, number> = {};
    allEvents.forEach(e => {
      categoryCount[e.category] = (categoryCount[e.category] || 0) + 1;
    });
    
    const topCategory = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)[0];
    
    const highVelocityCount = allEvents.filter(e => e.velocity >= 60).length;
    
    return {
      total: allEvents.length,
      avgVelocity,
      topCategory: topCategory ? topCategory[0] : "general",
      topCategoryCount: topCategory ? topCategory[1] : 0,
      highVelocity: highVelocityCount,
      categoryBreakdown: categoryCount,
    };
  }, [allEvents]);

  // Removed auth requirement - dashboard is now public for demo purposes
  // TODO: Add back auth for premium features later

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
            <ConnectWallet />
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Upgrade
              </Button>
            </Link>
            <Link href="/stream">
              <Button variant="outline" size="sm" className="gap-2">
                <Activity className="h-4 w-4" />
                Live Stream
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user?.name || user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Market Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time news events matched to prediction markets
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <Badge variant="outline" className="text-xs">Live</Badge>
              </div>
              <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Active Events</div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <Badge variant="outline" className="text-xs">Avg</Badge>
              </div>
              <div className="text-3xl font-bold text-accent mb-1">{stats.avgVelocity}</div>
              <div className="text-sm text-muted-foreground">Velocity Score</div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-5 w-5 text-chart-3" />
                <Badge variant="outline" className="text-xs">Hot</Badge>
              </div>
              <div className="text-3xl font-bold text-chart-3 mb-1">{stats.highVelocity}</div>
              <div className="text-sm text-muted-foreground">High Velocity</div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-chart-4/10 to-chart-4/5 border-chart-4/20">
              <div className="flex items-center justify-between mb-2">
                <PieChart className="h-5 w-5 text-chart-4" />
                <Badge variant="outline" className="text-xs">Top</Badge>
              </div>
              <div className="text-2xl font-bold text-chart-4 mb-1 capitalize">{stats.topCategory}</div>
              <div className="text-sm text-muted-foreground">{stats.topCategoryCount} events</div>
            </Card>
          </div>
        )}

        {/* Category Breakdown */}
        {stats && (
          <Card className="p-6 mb-8 bg-card/50 backdrop-blur border-border/40">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Category Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.categoryBreakdown).map(([category, count]) => {
                const percentage = Math.round((count / stats.total) * 100);
                const colors: Record<string, string> = {
                  crypto: "bg-chart-3",
                  economy: "bg-primary",
                  tech: "bg-chart-4",
                  politics: "bg-accent",
                  general: "bg-muted-foreground",
                };
                const color = colors[category] || "bg-muted-foreground";
                
                return (
                  <div key={category} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{category}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Category:
          </div>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat || (cat === "all" && !selectedCategory) ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat === "all" ? null : cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-2"
            onClick={() => refetchNews()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* News Feed */}
        {newsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </Card>
            ))}
          </div>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          <div className="space-y-6">
            {filteredEvents.map((event: any, idx: number) => {
              const markets = opportunityMap.get(event.title) || [];
              return (
                <NewsEventCard 
                  key={idx} 
                  opportunity={{ event, markets }} 
                  isLoadingMarkets={oppsLoading && markets.length === 0}
                />
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No Events Found
            </h3>
            <p className="text-muted-foreground">
              Try selecting a different category or refresh the feed.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function NewsEventCard({ opportunity, isLoadingMarkets }: { opportunity: any; isLoadingMarkets?: boolean }) {
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  
  const event = opportunity.event;
  const matchedMarkets = opportunity.markets || [];
  
  const handleTradeClick = (market: any) => {
    setSelectedMarket({
      id: market.id,
      title: market.question,
      venue: market.venue,
      probability: market.probability,
      url: market.url,
    });
    setTradeModalOpen(true);
  };
  const velocityColor = 
    event.velocity >= 80 ? "text-chart-3" :
    event.velocity >= 60 ? "text-primary" :
    event.velocity >= 40 ? "text-accent" :
    "text-muted-foreground";

  const velocityLabel = 
    event.velocity >= 80 ? "🔥 Breaking" :
    event.velocity >= 60 ? "⚡ Trending" :
    event.velocity >= 40 ? "📈 Rising" :
    "💡 Emerging";

  const categoryColors: Record<string, string> = {
    crypto: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    politics: "bg-accent/10 text-accent border-accent/20",
    economy: "bg-primary/10 text-primary border-primary/20",
    tech: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    general: "bg-muted text-muted-foreground border-border",
  };
  const categoryColor = categoryColors[event.category] || "bg-muted text-muted-foreground border-border";

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-border/40 hover:border-primary/40 transition-all">
      {/* Event Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={categoryColor}>
              {event.category}
            </Badge>
            <Badge variant="outline" className={velocityColor}>
              {velocityLabel}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(event.publishedAt).toLocaleTimeString()}
            </span>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {event.title}
          </h3>
          <p className="text-muted-foreground mb-3">
            {event.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {event.keywords.slice(0, 5).map((keyword: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className={`text-3xl font-bold ${velocityColor}`}>
              {event.velocity}
            </div>
            <div className="text-xs text-muted-foreground">Velocity</div>
          </div>
        </div>
      </div>

      {/* Matched Markets Section */}
      {isLoadingMarkets ? (
        <div className="mt-6 pt-6 border-t border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-semibold">Finding Related Markets...</span>
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ) : matchedMarkets.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-semibold">Related Markets</span>
            <Badge variant="outline" className="ml-auto">
              {matchedMarkets.length} found
            </Badge>
          </div>
          <div className="space-y-3">
            {matchedMarkets.map((match: any, i: number) => (
              <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {match.market.venue}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {match.relevanceScore}% match
                      </Badge>
                    </div>
                    <p className="font-medium text-sm mb-1">{match.market.question}</p>
                    {match.market.probability && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        {(match.market.probability * 100).toFixed(1)}% probability
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => handleTradeClick(match.market)}
                    >
                      <Zap className="h-3 w-3" />
                      Trade Now
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1" asChild>
                      <a href={match.market.url} target="_blank" rel="noopener noreferrer">
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {event.url && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={event.url} target="_blank" rel="noopener noreferrer">
              Read Full Story
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      )}
      <TradeModal 
        open={tradeModalOpen} 
        onOpenChange={setTradeModalOpen} 
        market={selectedMarket}
      />
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
