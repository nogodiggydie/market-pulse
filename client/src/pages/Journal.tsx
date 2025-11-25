import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  TrendingDown,
  Zap, 
  Plus,
  X,
  Tag as TagIcon,
  BarChart3,
  Target,
  Award,
  AlertCircle,
  BookOpen
} from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Journal() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);

  // Fetch journal data
  const { data: tags, refetch: refetchTags } = trpc.journal.tags.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: positionsWithTags, isLoading: positionsLoading } = trpc.journal.positionsWithTags.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: tagAnalytics } = trpc.journal.tagAnalytics.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: insights } = trpc.journal.insights.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Create tag mutation
  const createTagMutation = trpc.journal.tags.create.useMutation({
    onSuccess: () => {
      toast.success("Tag created successfully");
      setIsCreateTagOpen(false);
      refetchTags();
    },
    onError: (error) => {
      toast.error(`Failed to create tag: ${error.message}`);
    },
  });

  // Delete tag mutation
  const deleteTagMutation = trpc.journal.tags.delete.useMutation({
    onSuccess: () => {
      toast.success("Tag deleted successfully");
      refetchTags();
    },
    onError: (error) => {
      toast.error(`Failed to delete tag: ${error.message}`);
    },
  });

  if (authLoading) {
    return <JournalSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-2">
            Sign In Required
          </h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to access your trade journal and performance analytics.
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  const filteredPositions = selectedTag
    ? positionsWithTags?.filter((p) => p.tags.some((t) => t.id === selectedTag))
    : positionsWithTags;

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
                <Target className="h-4 w-4" />
                My Positions
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Dashboard
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
          <h1 className="font-['Space_Grotesk'] text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-chart-4 to-accent bg-clip-text text-transparent">
            Trade Journal
          </h1>
          <p className="text-muted-foreground">
            Analyze your trading performance with tags, notes, and insights
          </p>
        </div>

        {/* Performance Insights */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 border-border/40 bg-gradient-to-br from-card to-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className={`text-3xl font-bold mt-1 ${insights.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                    {insights.winRate.toFixed(1)}%
                  </p>
                </div>
                <Award className={`h-8 w-8 ${insights.winRate >= 50 ? 'text-green-500' : 'text-red-500'} opacity-50`} />
              </div>
            </Card>

            <Card className="p-6 border-border/40 bg-gradient-to-br from-card to-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className={`text-3xl font-bold mt-1 ${insights.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {insights.totalPnL >= 0 ? '+' : ''}${insights.totalPnL.toFixed(2)}
                  </p>
                </div>
                {insights.totalPnL >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
                )}
              </div>
            </Card>

            <Card className="p-6 border-border/40 bg-gradient-to-br from-card to-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Win</p>
                  <p className="text-3xl font-bold mt-1 text-green-500">
                    ${insights.avgWin.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6 border-border/40 bg-gradient-to-br from-card to-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Loss</p>
                  <p className="text-3xl font-bold mt-1 text-red-500">
                    ${insights.avgLoss.toFixed(2)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* Tag Analytics */}
        {tagAnalytics && tagAnalytics.length > 0 && (
          <Card className="p-6 mb-8 border-border/40 bg-gradient-to-br from-card to-card/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Performance by Tag</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tagAnalytics.map((tag) => (
                <Card key={tag.tagId} className="p-4 border-border/40">
                  <div className="flex items-start justify-between mb-3">
                    <Badge style={{ backgroundColor: tag.tagColor || '#3b82f6' }}>
                      {tag.tagName}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className={`text-lg font-bold ${tag.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                        {tag.winRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Trades</p>
                      <p className="font-semibold">{tag.totalTrades}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total P&L</p>
                      <p className={`font-semibold ${tag.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${tag.totalPnL.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Tag Management */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Tags</h2>
          </div>
          <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tag</DialogTitle>
              </DialogHeader>
              <CreateTagForm onSubmit={(data) => createTagMutation.mutate(data)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Tag List */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={selectedTag === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTag(null)}
          >
            All Positions
          </Button>
          {tags?.map((tag) => (
            <div key={tag.id} className="flex items-center gap-1">
              <Button
                variant={selectedTag === tag.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(tag.id)}
                style={{
                  backgroundColor: selectedTag === tag.id ? tag.color || undefined : undefined,
                  borderColor: tag.color || undefined,
                }}
              >
                {tag.name}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete tag "${tag.name}"?`)) {
                    deleteTagMutation.mutate(tag.id);
                  }
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Positions List */}
        {positionsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-24 w-full" />
              </Card>
            ))}
          </div>
        ) : filteredPositions && filteredPositions.length > 0 ? (
          <div className="space-y-4">
            {filteredPositions.map((position) => (
              <JournalPositionCard key={position.id} position={position} tags={tags || []} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No positions found</h3>
            <p className="text-muted-foreground mb-6">
              {selectedTag
                ? "No positions with this tag. Try selecting a different tag or view all positions."
                : "Start trading and add tags to track your performance."}
            </p>
            <Link href="/dashboard">
              <Button>View Opportunities</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}

function JournalPositionCard({ position, tags }: { position: any; tags: any[] }) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [selectedNewTag, setSelectedNewTag] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const addTagMutation = trpc.journal.addTag.useMutation({
    onSuccess: () => {
      toast.success("Tag added");
      setIsAddingTag(false);
      setSelectedNewTag(null);
      utils.journal.positionsWithTags.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to add tag: ${error.message}`);
    },
  });

  const removeTagMutation = trpc.journal.removeTag.useMutation({
    onSuccess: () => {
      toast.success("Tag removed");
      utils.journal.positionsWithTags.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to remove tag: ${error.message}`);
    },
  });

  const pnl = position.pnl || 0;
  const isProfitable = pnl >= 0;

  const availableTags = tags.filter(
    (tag) => !position.tags.some((pt: any) => pt.id === tag.id)
  );

  return (
    <Card className="p-6 border-border/40 hover:border-primary/50 transition-colors">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{position.venue}</Badge>
              <Badge variant={position.side === "YES" ? "default" : "secondary"}>
                {position.side}
              </Badge>
              <Badge variant={position.status === "open" ? "default" : "secondary"}>
                {position.status}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg">{position.question}</h3>
          </div>
          {position.status === "closed" && (
            <div className={`flex items-center gap-1 text-lg font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
              {isProfitable ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              ${pnl.toFixed(2)}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {position.tags.map((tag: any) => (
            <div key={tag.id} className="flex items-center gap-1">
              <Badge style={{ backgroundColor: tag.color }}>
                {tag.name}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTagMutation.mutate({ positionId: position.id, tagId: tag.id })}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {isAddingTag ? (
            <div className="flex items-center gap-2">
              <select
                className="text-sm border rounded px-2 py-1"
                value={selectedNewTag || ""}
                onChange={(e) => setSelectedNewTag(Number(e.target.value))}
              >
                <option value="">Select tag...</option>
                {availableTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={() => {
                  if (selectedNewTag) {
                    addTagMutation.mutate({ positionId: position.id, tagId: selectedNewTag });
                  }
                }}
                disabled={!selectedNewTag}
              >
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingTag(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsAddingTag(true)} className="gap-1">
              <Plus className="h-3 w-3" />
              Add Tag
            </Button>
          )}
        </div>

        {/* Journal Notes */}
        {(position.entryReasoning || position.exitReasoning || position.lessonsLearned || position.notes) && (
          <div className="space-y-2 pt-4 border-t border-border/40">
            {position.entryReasoning && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Entry Reasoning:</p>
                <p className="text-sm">{position.entryReasoning}</p>
              </div>
            )}
            {position.exitReasoning && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Exit Reasoning:</p>
                <p className="text-sm">{position.exitReasoning}</p>
              </div>
            )}
            {position.lessonsLearned && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Lessons Learned:</p>
                <p className="text-sm">{position.lessonsLearned}</p>
              </div>
            )}
            {position.notes && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Notes:</p>
                <p className="text-sm">{position.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function CreateTagForm({ onSubmit }: { onSubmit: (data: { name: string; color?: string }) => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, color });
    setName("");
    setColor("#3b82f6");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Tag Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., high-conviction, earnings-play"
          required
        />
      </div>
      <div>
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#3b82f6"
          />
        </div>
      </div>
      <Button type="submit" className="w-full">Create Tag</Button>
    </form>
  );
}

function JournalSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      </header>
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}
