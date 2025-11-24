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
  Sparkles
} from "lucide-react";
import { APP_TITLE } from "@/const";
import { Link } from "wouter";
import { useState } from "react";

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch trending news
  const { data: newsEvents, isLoading: newsLoading, refetch: refetchNews } = trpc.news.trending.useQuery();

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
  const filteredEvents = selectedCategory && selectedCategory !== "all"
    ? newsEvents?.filter(e => e.category === selectedCategory)
    : newsEvents;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <div className="absolute inset-0 rotate-45 rounded-lg bg-gradient-to-br from-primary via-chart-2 to-accent"></div>
                <div className="absolute inset-0.5 rotate-45 rounded-md bg-background"></div>
                <Zap className="relative h-4 w-4 text-primary z-10" />
              </div>
              <span className="font-['Space_Grotesk'] text-xl font-bold bg-gradient-to-r from-primary via-chart-4 to-accent bg-clip-text text-transparent">
                {APP_TITLE}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
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
            {filteredEvents.map((event, idx) => (
              <NewsEventCard key={idx} event={event} />
            ))}
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

function NewsEventCard({ event }: { event: any }) {
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
      <div className="mt-6 pt-6 border-t border-border/40">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="font-semibold">Related Markets</span>
          <Badge variant="outline" className="ml-auto">
            Coming Soon
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-powered market matching will show relevant prediction markets here.
        </p>
      </div>

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
