# Market Pulse - Project TODO

## Database & Schema
- [x] Create venues table (Kalshi, Polymarket, Manifold)
- [x] Create markets table with status, category, close_time
- [x] Create quotes table for market prices
- [x] Create news_events table for trending events
- [x] Create market_matches table for news-to-market relationships
- [x] Create opportunities table for scored opportunities

## Backend API
- [x] Port news detection logic (NewsAPI integration with demo fallback)
- [x] Port market matcher (LLM-based relevance scoring)
- [x] Port opportunity scorer (multi-factor scoring system)
- [x] Create tRPC procedures for news opportunities
- [ ] Create tRPC procedures for Market of the Hour
- [ ] Add real-time SSE/WebSocket streaming endpoints
- [x] Integrate OpenRouter API for LLM calls
- [x] Add NewsAPI integration

## Frontend - Landing Page
- [x] Design modern hero section with gradient effects
- [x] Create features showcase section
- [x] Add "How It Works" section
- [x] Implement CTA sections for signup
- [x] Add responsive navigation
- [x] Create footer with links

## Frontend - News Dashboard
- [x] Create news feed with event cards
- [ ] Display matched markets for each event
- [ ] Show opportunity scores with breakdowns
- [x] Add filtering by category (crypto, politics, economy, tech)
- [ ] Implement real-time updates
- [x] Add loading states and skeletons

## Frontend - Market of the Hour
- [ ] Create featured market card component
- [ ] Add AI-generated insights display
- [ ] Show velocity and momentum indicators
- [ ] Implement auto-refresh
- [ ] Add share functionality

## Frontend - Streaming Dashboard
- [ ] Create full-screen streaming view (1920x1080)
- [ ] Implement auto-rotating content (15s intervals)
- [ ] Add glass-morphism effects
- [ ] Show live market updates
- [ ] Add ticker-style news feed
- [ ] Optimize for OBS/streaming software

## Authentication
- [ ] Configure Google OAuth
- [ ] Add protected routes for premium features
- [ ] Create user profile page
- [ ] Implement role-based access (free vs premium)

## Styling & Design
- [ ] Choose color palette (cyan/magenta/lime accent theme)
- [ ] Set up custom fonts (Space Grotesk + Inter)
- [ ] Create consistent component library
- [ ] Add animations and transitions
- [ ] Implement dark theme
- [ ] Add loading animations

## Testing
- [ ] Write tests for news detection
- [ ] Write tests for market matching
- [ ] Write tests for opportunity scoring
- [ ] Test real-time streaming
- [ ] Test authentication flow

## Deployment
- [ ] Create Dockerfile
- [ ] Set up docker-compose.yml
- [ ] Configure environment variables
- [ ] Add production build scripts
- [ ] Create deployment documentation
