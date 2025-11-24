# Market Pulse - Deployment Guide

This guide explains how to deploy Market Pulse using Docker.

## Prerequisites

- Docker and Docker Compose installed
- MySQL database (or use the included docker-compose database service)
- Environment variables configured (see below)

## Quick Start with Docker Compose

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd market-pulse
   ```

2. **Configure environment variables**
   
   All required environment variables are already configured in the Manus platform. For external deployment, you'll need:
   
   - `DATABASE_URL` - MySQL connection string
   - `JWT_SECRET` - Secret for session cookies
   - `NEWSAPI_KEY` (optional) - Get from https://newsapi.org/ for real news data
   
   Other variables (OAuth, analytics, etc.) are provided by the Manus platform.

3. **Build and run**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Open http://localhost:3000 in your browser
   - Landing page: http://localhost:3000/
   - Dashboard: http://localhost:3000/dashboard
   - Streaming view: http://localhost:3000/stream

## Manual Docker Build

If you prefer to build and run manually:

```bash
# Build the image
docker build -t market-pulse .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  -e JWT_SECRET="your-secret" \
  -e NEWSAPI_KEY="your-key" \
  market-pulse
```

## Database Setup

The application uses MySQL. You can either:

1. **Use an external MySQL database** (recommended for production)
   - Set `DATABASE_URL` to your MySQL connection string
   - Run migrations: `pnpm db:push`

2. **Use the included docker-compose database**
   - Uncomment the `db` service in `docker-compose.yml`
   - Update `DATABASE_URL` to point to the container

## Environment Variables

### Required
- `DATABASE_URL` - MySQL connection string

### Optional
- `NEWSAPI_KEY` - NewsAPI key for real-time news (falls back to demo data if not provided)

### Platform-Managed (Manus)
These are automatically provided when deployed on Manus:
- `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_APP_ID`
- `BUILT_IN_FORGE_API_KEY`, `BUILT_IN_FORGE_API_URL`
- `OWNER_OPEN_ID`, `OWNER_NAME`
- Analytics and other platform features

## Production Checklist

- [ ] Set up MySQL database with proper credentials
- [ ] Configure `DATABASE_URL` environment variable
- [ ] (Optional) Get NewsAPI key from https://newsapi.org/
- [ ] Run database migrations: `pnpm db:push`
- [ ] Build Docker image: `docker build -t market-pulse .`
- [ ] Test the deployment locally
- [ ] Set up reverse proxy (nginx/traefik) for HTTPS
- [ ] Configure domain and SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure backups for database

## Streaming Setup (OBS/Twitch/YouTube)

The `/stream` route is optimized for streaming software:

1. Open http://localhost:3000/stream in a browser
2. In OBS:
   - Add Browser Source
   - URL: http://localhost:3000/stream
   - Width: 1920, Height: 1080
   - Check "Shutdown source when not visible"
3. The page auto-refreshes every 30 seconds with new data

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs app`
- Verify DATABASE_URL is correct
- Ensure database is accessible from container

### Database connection errors
- Verify MySQL is running
- Check DATABASE_URL format: `mysql://user:password@host:port/database`
- Ensure database exists and migrations are run

### Demo data showing instead of real news
- Add `NEWSAPI_KEY` environment variable
- Get free API key from https://newsapi.org/

## Scaling

For production deployment:

1. **Use managed database** (AWS RDS, Google Cloud SQL, etc.)
2. **Deploy to container orchestration** (Kubernetes, ECS, etc.)
3. **Add caching layer** (Redis) for API responses
4. **Set up CDN** for static assets
5. **Configure auto-scaling** based on traffic

## Support

For issues or questions:
- Check the main README.md
- Review the codebase documentation
- Contact: [Your support email/link]
