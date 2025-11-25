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
  Brain,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import { APP_TITLE } from "@/const";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch trending news fast
  const { data: newsEvents, isLoading: newsLoading, refetch: refetchNews } = trpc.news.trending.useQuery({ limit: 10 });
  
  // Fetch matched markets for top 3 (slower)
  const { data: opportunities, isLoading: oppsLoading } = trpc.news.opportunities.useQuery({ limit: 3 });

  // Warm cache mutation
  const warmCacheMutation = trpc.news.warmCache.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Cache warmed! ${result.warmed} events cached, ${result.skipped} already cached, ${result.failed} failed`
      );
    },
    onError: (error) => {
      toast.error(`Failed to warm cache: ${error.message}`);
    },
  });

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-2">
            Sign In Required
          </h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to access the dashboard and start tracking opportunities.
          </p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const categories = ["all", "crypto", "politics", "economy", "tech"];
  // Combine news with opportunities
  const allEvents = newsEvents || [];
  const opportunityMap = new Map(
    opportunities?.map((opp: any) => [opp.event.title, opp.markets]) || []
  );
  
  const filteredEvents = selectedCategory && selectedCategory !== "all"
    ? allEvents.filter(e => e.category === selectedCategory)
    : allEvents;

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
            <Link href="/positions">
              <Button variant="ghost" size="sm" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                My Positions
              </Button>
            </Link>
            <Link href="/stream">
              <Button variant="outline" size="sm" className="gap-2">
                <Zap className="h-4 w-4" />
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
          <h1 className="font-['Space_Grotesk'] text-4xl font-bold mb-2">
            Market Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time news events matched to prediction markets
          </p>
        </div>

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
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => warmCacheMutation.mutate({ velocityThreshold: 60 })}
              disabled={warmCacheMutation.isPending}
            >
              <Zap className="h-4 w-4" />
              {warmCacheMutation.isPending ? "Warming..." : "Warm Cache"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => refetchNews()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
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
            <h3 className="font-['Space_Grotesk'] text-xl font-semibold mb-2">
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
  const event = opportunity.event;
  const [localMarkets, setLocalMarkets] = useState<any[]>(opportunity.markets || []);
  const [showMarkets, setShowMarkets] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  // Match markets on-demand
  const matchEventQuery = trpc.news.matchEvent.useQuery(
    {
      title: event.title,
      keywords: event.keywords,
      limit: 3,
    },
    {
      enabled: showMarkets && localMarkets.length === 0,
    }
  );

  // Update local markets when query succeeds
  useEffect(() => {
    if (matchEventQuery.data && matchEventQuery.data.length > 0) {
      setLocalMarkets(matchEventQuery.data);
    }
  }, [matchEventQuery.data]);

  // AI analysis query
  const analysisQuery = trpc.news.analyzeEvent.useQuery(
    {
      title: event.title,
      description: event.description,
      relatedMarkets: localMarkets.map((m: any) => ({
        question: m.market.question,
        venue: m.market.venue,
        probability: m.market.probability,
      })),
    },
    {
      enabled: showAnalysis && !analysis,
    }
  );

  // Update analysis when query succeeds
  useEffect(() => {
    if (analysisQuery.data) {
      setAnalysis(analysisQuery.data);
    }
  }, [analysisQuery.data]);

  const matchedMarkets = localMarkets;
  const isLoadingMarketsLocal = matchEventQuery.isLoading && showMarkets;
  const isLoadingAnalysis = analysisQuery.isLoading && showAnalysis;
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
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold mb-2">
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
      {isLoadingMarketsLocal ? (
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
                  <Button variant="ghost" size="sm" className="gap-1" asChild>
                    <a href={match.market.url} target="_blank" rel="noopener noreferrer">
                      View
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      {isLoadingAnalysis ? (
        <div className="mt-6 pt-6 border-t border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-accent animate-pulse" />
            <span className="font-semibold">Analyzing Market Impact...</span>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ) : analysis && (
        <div className="mt-6 pt-6 border-t border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-accent" />
            <span className="font-semibold">AI Market Analysis</span>
            <Badge 
              variant={analysis.sentiment === 'bullish' ? 'default' : analysis.sentiment === 'bearish' ? 'destructive' : 'secondary'}
              className="ml-auto gap-1"
            >
              {analysis.sentiment === 'bullish' && <TrendingUp className="h-3 w-3" />}
              {analysis.sentiment === 'bearish' && <TrendingDown className="h-3 w-3" />}
              {analysis.sentiment === 'neutral' && <Minus className="h-3 w-3" />}
              {analysis.sentiment.toUpperCase()}
            </Badge>
            <Badge variant="outline">{analysis.confidence}% confidence</Badge>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-start gap-2 mb-2">
                <Info className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">Market Impact</p>
                  <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
              <p className="font-medium text-sm mb-1">Prediction</p>
              <p className="text-sm text-muted-foreground">{analysis.marketImpact}</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">Suggested Action</p>
                  <p className="text-sm text-muted-foreground">{analysis.suggestedAction}</p>
                </div>
              </div>
            </div>
            {analysis.keyFactors && analysis.keyFactors.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">Key Factors</p>
                <ul className="space-y-1">
                  {analysis.keyFactors.map((factor: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <Badge variant="outline" className="text-xs">
                Risk: {analysis.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        {!showMarkets && matchedMarkets.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowMarkets(true)}
          >
            <TrendingUp className="h-4 w-4" />
            Show Related Markets
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowAnalysis(true)}
        >
          <Brain className="h-4 w-4" />
          AI Analysis
        </Button>
        {event.url && (
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={event.url} target="_blank" rel="noopener noreferrer">
              Read Full Story
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8" />
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
