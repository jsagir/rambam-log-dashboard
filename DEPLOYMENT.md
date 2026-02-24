# Deployment Guide - Rambam Log Dashboard

## Deploy to Render (Recommended)

This dashboard requires server-side processing (Node.js + Python), so it must be deployed as a **Web Service**, not a static site.

### Prerequisites

- GitHub account
- Render account (free tier available)

### Step 1: Push to GitHub

```bash
# In the project directory
git add .
git commit -m "Initial commit - Rambam Log Dashboard"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/rambam-log-dashboard.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Render

#### Option A: Automatic (with render.yaml)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and configure automatically
5. Click **"Apply"**

#### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `rambam-log-dashboard`
   - **Runtime**: `Node`
   - **Build Command**: `./build.sh`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or higher)
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PYTHON_VERSION` = `3.11`
6. Click **"Create Web Service"**

### Step 3: Wait for Deployment

- First build takes ~5-10 minutes
- Render installs Node.js and Python dependencies
- Builds the Next.js application
- Deploys to a `.onrender.com` URL

### Step 4: Access Your Dashboard

Once deployed, your dashboard will be available at:
```
https://rambam-log-dashboard.onrender.com
```

## Environment Variables

Set these in Render Dashboard → Settings → Environment:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PYTHON_VERSION` | `3.11` | Python version for scripts |

## Monitoring

- **Logs**: Render Dashboard → Logs tab
- **Metrics**: Render Dashboard → Metrics tab
- **Health Check**: Your dashboard URL should load

## Free Tier Notes

Render's free tier:
- ✅ 750 hours/month (plenty for a dashboard)
- ✅ Automatic HTTPS
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold start takes ~30 seconds

For production use, upgrade to Starter ($7/month) for:
- No spin-down
- Faster builds
- More resources

## Troubleshooting

### Build Fails

Check Render logs for:
- Python installation issues → verify `python/requirements.txt`
- Node modules → verify `package.json`
- Build script permissions → ensure `build.sh` is executable

### Dashboard Loads but Analysis Fails

- Check that Python scripts are in `python/` directory
- Verify Python dependencies installed
- Check Render logs for runtime errors

### Slow Performance

- Free tier spins down after inactivity
- First request after spin-down takes 30+ seconds
- Consider upgrading to Starter plan

## Alternative Deployment Options

### Vercel (Node.js only - requires modification)

Vercel doesn't natively support Python, so you'd need to:
1. Deploy Python scripts separately (AWS Lambda, etc.)
2. Modify API routes to call external service
3. Not recommended for this use case

### Railway

Similar to Render, supports Node.js + Python:
1. Connect GitHub repo
2. Railway auto-detects and deploys
3. Free tier: $5 credit/month

### Self-Hosted

```bash
# On your server
git clone https://github.com/YOUR_USERNAME/rambam-log-dashboard.git
cd rambam-log-dashboard
npm install
pip install -r python/requirements.txt
npm run build
npm start

# Access at http://localhost:3000
```

## Updating Deployment

After pushing changes to GitHub:
- Render auto-deploys on every push to `main` branch
- Or manually trigger from Render Dashboard

## Custom Domain

In Render Dashboard → Settings → Custom Domain:
1. Add your domain (e.g., `rambam-logs.motj.org.il`)
2. Update DNS records as instructed
3. Render provides automatic HTTPS

## Security Notes

- Log files may contain visitor questions (no PII by design)
- Use Render's built-in authentication if needed
- Consider IP whitelisting for internal use only
- Logs are processed server-side and not stored permanently

---

For questions or issues, refer to:
- [Render Documentation](https://render.com/docs)
- Project README.md
- CLAUDE.md for architecture details
