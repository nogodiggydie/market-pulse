# Rendering Bug Investigation

## Date: 2025-11-25

## Issues Found

### 1. AI Analysis Button Not Rendering
**Location:** `client/src/pages/Dashboard.tsx` lines 531-539
**Status:** STILL NOT FIXED

**Code:**
```jsx
<Button
  variant="outline"
  size="sm"
  className="gap-2"
  onClick={() => setShowAnalysis(true)}
>
  <Brain className="h-4 w-4" />
  AI Analysis
</Button>
```

**Attempted Fix:** Moved button outside conditional block that wraps "Show Related Markets"
**Result:** Button still not appearing in production build

**Observations:**
- Button code exists in source file
- No JavaScript errors in console
- Production build completed successfully
- Button simply doesn't appear in DOM

### 2. Venue Filter Buttons Not Rendering
**Location:** `client/src/pages/Dashboard.tsx` lines 162-179
**Status:** STILL NOT FIXED

**Code:**
```jsx
{/* Venue Filters */}
<div className="flex items-center gap-4 flex-wrap">
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <DollarSign className="h-4 w-4" />
    Venue:
  </div>
  <div className="flex gap-2">
    {["all", "kalshi", "polymarket", "manifold"].map((venue) => (
      <Button
        key={venue}
        variant={selectedVenue === venue || (venue === "all" && !selectedVenue) ? "default" : "outline"}
        size="sm"
        onClick={() => setSelectedVenue(venue === "all" ? null : venue)}
      >
        {venue.charAt(0).toUpperCase() + venue.slice(1)}
      </Button>
    ))}
  </div>
</div>
```

**Attempted Fix:** Moved venue filters to separate row using `space-y-4` wrapper
**Result:** Venue filter section still not appearing

**Observations:**
- Code structure looks correct
- Category filters (in same parent component) render fine
- Venue filter section completely missing from DOM
- No console errors

## Hypothesis

The issue appears to be that certain JSX sections are being **tree-shaken** or **optimized out** during the Vite build process, possibly because:

1. **Dead code elimination:** Vite might think these components are unused
2. **Conditional rendering issue:** There might be a parent conditional we're missing
3. **Build cache corruption:** The build might be using cached/stale chunks

## Next Steps

1. Check if there's a parent conditional hiding these sections
2. Clear Vite build cache completely (`rm -rf node_modules/.vite dist`)
3. Add console.log statements directly in JSX to force evaluation
4. Check if `selectedVenue` state is being initialized properly
5. Verify all imports (Brain, DollarSign icons) are correct
