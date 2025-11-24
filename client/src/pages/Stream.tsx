import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Zap, Clock, Activity, Sparkles } from "lucide-react";
import { APP_TITLE } from "@/const";

export default function Stream() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { data: marketOfHour, refetch: refetchMarket } = trpc.news.marketOfHour.useQuery();
  const { data: opportunities, refetch: refetchOpps } = trpc.news.opportunities.useQuery({ limit: 10 });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      refetchMarket();
      refetchOpps();
    }, 30000);
    return () => clearInterval(refreshTimer);
  }, [refetchMarket, refetchOpps]);

  const topEvent = marketOfHour?.event;
  const recentEvents = opportunities?.slice(0, 3).map((opp: any) => opp.event) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      {/* Header Bar */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
            <Zap className="h-6 w-6 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-chart-4 to-accent bg-clip-text text-transparent">
              {APP_TITLE}
            </h1>
            <p className="text-sm text-muted-foreground">Live Market Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-chart-3">
            <Activity className="h-5 w-5 animate-pulse" />
            <span className="font-semibold">LIVE</span>
          </div>
          <div className="text-right">
            <div className="font-['Space_Grotesk'] text-2xl font-bold">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Market of the Hour - Large Featured Card */}
        <div className="col-span-2">
          <Card className="relative overflow-hidden border-primary/40 bg-gradient-to-br from-card/90 via-card/80 to-primary/5 backdrop-blur-xl shadow-2xl shadow-primary/10 h-full">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzBERjlGRiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-30" />
            
            <div className="relative p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-['Space_Grotesk'] text-2xl font-bold">Market of the Hour</h2>
                    <p className="text-sm text-muted-foreground">Top trending opportunity right now</p>
                  </div>
                </div>
                <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/40 text-lg px-4 py-2">
                  🔥 Breaking
                </Badge>
              </div>

              {topEvent ? (
                <>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-primary/20 text-primary border-primary/40">
                        {topEvent.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(topEvent.publishedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <h3 className="font-['Space_Grotesk'] text-3xl font-bold leading-tight mb-4">
                      {topEvent.title}
                    </h3>
                    <p className="text-lg text-muted-foreground mb-6">
                      {topEvent.description}
                    </p>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 bg-primary/10 border-primary/20">
                      <div className="text-sm text-muted-foreground mb-1">Velocity</div>
                      <div className="text-3xl font-bold text-primary">{topEvent.velocity}</div>
                    </Card>
                    <Card className="p-4 bg-accent/10 border-accent/20">
                      <div className="text-sm text-muted-foreground mb-1">Source</div>
                      <div className="text-xl font-bold text-accent truncate">{topEvent.source}</div>
                    </Card>
                    <Card className="p-4 bg-chart-3/10 border-chart-3/20">
                      <div className="text-sm text-muted-foreground mb-1">Keywords</div>
                      <div className="text-xl font-bold text-chart-3">{topEvent.keywords.length}</div>
                    </Card>
                  </div>

                  {/* Keywords */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {topEvent.keywords.slice(0, 6).map((keyword: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-sm">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-xl text-muted-foreground">Loading top opportunity...</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Events Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-accent" />
            <h3 className="font-['Space_Grotesk'] text-xl font-bold">Recent Events</h3>
          </div>
          
          {recentEvents.map((event: any, idx: number) => (
            <Card
              key={idx}
              className="p-4 bg-card/50 backdrop-blur border-border/40 hover:border-accent/40 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge className="bg-accent/20 text-accent border-accent/40 text-xs">
                  {event.category}
                </Badge>
                <div className="text-2xl font-bold text-accent">{event.velocity}</div>
              </div>
              <h4 className="font-semibold text-sm leading-tight mb-2 line-clamp-2">
                {event.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {event.description}
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(event.publishedAt).toLocaleTimeString()}
              </div>
            </Card>
          ))}

          {recentEvents.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Loading events...</p>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Ticker */}
      <div className="mt-8">
        <Card className="p-4 bg-card/30 backdrop-blur border-border/40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary">
              <Activity className="h-4 w-4" />
              <span className="font-semibold text-sm">LIVE FEED</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee whitespace-nowrap">
                {opportunities?.map((opp: any, idx: number) => {
                  const event = opp.event;
                  return (
                  <span key={idx} className="inline-flex items-center gap-2 mr-8">
                    <Badge variant="outline" className="text-xs">
                      {event.category}
                    </Badge>
                    <span className="text-sm">{event.title}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                  </span>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Floating Stats */}
      <div className="fixed bottom-8 left-8 flex gap-4">
        <Card className="p-4 bg-card/80 backdrop-blur border-primary/40">
          <div className="text-xs text-muted-foreground mb-1">Markets Tracked</div>
          <div className="text-2xl font-bold text-primary">97,000+</div>
        </Card>
        <Card className="p-4 bg-card/80 backdrop-blur border-accent/40">
          <div className="text-xs text-muted-foreground mb-1">Active Events</div>
          <div className="text-2xl font-bold text-accent">{opportunities?.length || 0}</div>
        </Card>
      </div>
    </div>
  );
}
