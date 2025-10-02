# Backend API Deployment Guide

## Prerequisites

1. Node.js (v14 or higher)
2. A hosting platform account (Render, Heroku, or similar)
3. Your Supabase project credentials

## Environment Variables

Before deploying, make sure to set the following environment variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=5001
```

## Deployment Options

### Option 1: Render (Recommended)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following build command:
   ```
   npm install
   ```
4. Set the start command:
   ```
   node server.js
   ```
5. Add the environment variables mentioned above
6. Set the health check path to `/` (root)

### Option 2: Heroku

1. Create a new app on Heroku
2. Connect your GitHub repository
3. Enable automatic deploys
4. Add the environment variables in the "Settings" tab under "Config Vars"
5. Deploy the branch

### Option 3: VPS or Dedicated Server

1. Clone your repository to your server:
   ```bash
   git clone <your-repo-url>
   cd school-warehouse-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set environment variables:
   ```bash
   export SUPABASE_URL=your_supabase_project_url
   export SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   export PORT=5001
   ```

4. Start the server:
   ```bash
   node server.js
   ```

5. (Optional) Use a process manager like PM2 to keep the server running:
   ```bash
   npm install -g pm2
   pm2 start server.js
   pm2 startup
   pm2 save
   ```

## Updating Frontend Configuration

After deploying your backend, update your frontend to point to the new API URL:

1. In your frontend `.env.production` file, update:
   ```
   VITE_API_BASE_URL=https://your-deployed-backend-url.com
   ```

2. In your Vercel project settings, update the environment variable:
   ```
   VITE_API_BASE_URL = https://your-deployed-backend-url.com
   ```

## Troubleshooting

### CORS Issues
If you encounter CORS issues, make sure your server's CORS configuration includes your frontend domain:

```javascript
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://your-frontend-domain.vercel.app",
    // Add any other domains you want to allow
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};
```

### WebSocket Connection Issues
If WebSocket connections fail, ensure your hosting platform supports WebSocket connections. Some platforms require specific configuration.

### Database Connection Issues
If you see database connection errors:
1. Verify your Supabase credentials are correct
2. Check that your Supabase project is not paused
3. Ensure your IP is allowed in Supabase network restrictions (if applicable)

## Health Check

Your server includes a basic health check endpoint at the root path (`/`) that returns a simple message. This can be used by hosting platforms to check if your application is running.