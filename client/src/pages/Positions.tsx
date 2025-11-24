import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  TrendingDown,
  Wallet,
  ExternalLink,
  RefreshCw,
  Filter,
  DollarSign,
  Target,
  Clock,
  Zap
} from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";

type PositionFilter = "all" | "kalshi" | "polymarket";

export default function Positions() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<PositionFilter>("all");

  // Fetch Kalshi positions
  const { data: kalshiPositions, isLoading: kalshiLoading, refetch: refetchKalshi } = 
    trpc.trading.getKalshiPositions.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  // TODO: Add Polymarket positions endpoint
  // const { data: polymarketPositions, isLoading: polyLoading } = 
  //   trpc.trading.getPolymarketPositions.useQuery();

  const positions = useMemo(() => {
    const all = [
      ...(kalshiPositions || []).map(p => ({ ...p, venue: 'kalshi' as const })),
      // ...(polymarketPositions || []).map(p => ({ ...p, venue: 'polymarket' as const })),
    ];

    if (filter === "all") return all;
    return all.filter(p => p.venue === filter);
  }, [kalshiPositions, filter]);

  const stats = useMemo(() => {
    if (!positions.length) return null;

    const totalValue = positions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const totalCost = positions.reduce((sum, p) => sum + (p.totalCost || 0), 0);
    const totalPnL = totalValue - totalCost;
    const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    return {
      totalPositions: positions.length,
      totalValue,
      totalCost,
      totalPnL,
      pnlPercent,
      winning: positions.filter(p => (p.currentValue || 0) > (p.totalCost || 0)).length,
    };
  }, [positions]);

  const isLoading = kalshiLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center space-y-4">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">Login Required</h2>
          <p className="text-muted-foreground">
            Please sign in to view your positions and track your trades.
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="sm">Upgrade</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-chart-4 to-accent bg-clip-text text-transparent">
              My Positions
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your active bets across Kalshi and Polymarket
            </p>
          </div>
          <Button onClick={() => refetchKalshi()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-6 border-border/40 bg-gradient-to-br from-card to-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Positions</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalPositions}</p>
                </div>
                <Target className="h-8 w-8 text-primary opacity-50" />
              </div>
            </Card>

            <Card className="p-6 border-border/40 bg-gradient-to-br from-card to-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-3xl font-bold mt-1">${stats.totalValue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-chart-4 opacity-50" />
              </div>
            </Card>

            <Card className="p-6 border-border/40 bg-gradient-to-br from-card to-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className={`text-3xl font-bold mt-1 ${stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
                  </p>
                </div>
                {stats.totalPnL >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
                )}
              </div>
            </Card>

            <Card className="p-6 border-border/40 bg-gradient-to-br from-card to-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-3xl font-bold mt-1">
                    {Math.round((stats.winning / stats.totalPositions) * 100)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-accent opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
          <div className="flex gap-2">
            {(['all', 'kalshi', 'polymarket'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Positions List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-24 w-full" />
              </Card>
            ))}
          </div>
        ) : positions.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Positions Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start trading to see your positions here
            </p>
            <Button asChild>
              <Link href="/dashboard">View Opportunities</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {positions.map((position: any, idx) => {
              const pnl = (position.currentValue || 0) - (position.totalCost || 0);
              const pnlPercent = position.totalCost > 0 ? (pnl / position.totalCost) * 100 : 0;
              const isWinning = pnl >= 0;

              return (
                <Card key={idx} className="p-6 border-border/40 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Title and Venue */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{position.marketTitle || position.ticker}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">
                              {position.venue}
                            </Badge>
                            <Badge variant={position.side === 'yes' ? 'default' : 'secondary'}>
                              {position.side?.toUpperCase() || 'YES'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Position Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-semibold">{position.quantity || position.count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Price</p>
                          <p className="font-semibold">${(position.avgPrice || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Current Price</p>
                          <p className="font-semibold">${(position.currentPrice || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Close Date</p>
                          <p className="font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {position.closeDate ? new Date(position.closeDate).toLocaleDateString() : 'TBD'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* P&L Section */}
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">P&L</p>
                        <p className={`text-2xl font-bold ${isWinning ? 'text-green-500' : 'text-red-500'}`}>
                          {isWinning ? '+' : ''}${pnl.toFixed(2)}
                        </p>
                        <p className={`text-sm ${isWinning ? 'text-green-500' : 'text-red-500'}`}>
                          {isWinning ? '+' : ''}{pnlPercent.toFixed(1)}%
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={position.url || '#'} target="_blank" rel="noopener noreferrer">
                          View Market
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
