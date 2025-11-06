# Replit Setup Guide

Complete step-by-step guide to deploy your Lifer App on Replit.

## Step 1: Import from GitHub

1. Go to https://replit.com
2. Click **"Create Repl"**
3. Select **"Import from GitHub"**
4. Enter repository URL: `https://github.com/anehemy/lifer-app`
5. Click **"Import from GitHub"**

Replit will automatically clone your repository.

## Step 2: Configure Secrets

Click the **lock icon** (🔒) in the left sidebar to open Secrets, then add these environment variables:

### Required Secrets

```
DATABASE_URL
```
Your MySQL/TiDB connection string. Format:
```
mysql://username:password@hostname:3306/database_name
```

**Where to get it:**
- TiDB Cloud (recommended): https://tidbcloud.com
- PlanetScale: https://planetscale.com  
- Railway: https://railway.app

---

```
JWT_SECRET
```
Random string for JWT signing. Generate one:
```bash
# Run this in any terminal to generate a secure secret
openssl rand -base64 32
```

---

```
OPENAI_API_KEY
```
Your OpenAI API key (starts with `sk-`)

**Where to get it:** https://platform.openai.com/api-keys

---

```
ELEVENLABS_API_KEY
```
Your ElevenLabs API key for voice synthesis

**Where to get it:** https://elevenlabs.io/api

---

```
GEMINI_API_KEY  
```
Google Gemini API key (optional, for additional AI features)

**Where to get it:** https://makersuite.google.com/app/apikey

---

### Storage Configuration

You'll need S3-compatible storage for file uploads. Choose one:

**Option A: Cloudflare R2 (Recommended)**
- Free tier: 10GB storage
- No egress fees
- Sign up: https://cloudflare.com/r2

Add these secrets:
```
BUILT_IN_FORGE_API_URL=https://your-r2-endpoint
BUILT_IN_FORGE_API_KEY=your-r2-access-key
```

**Option B: AWS S3**
- Industry standard
- Pay-as-you-go
- Sign up: https://aws.amazon.com/s3

---

### Owner Configuration

```
OWNER_OPEN_ID
```
Your unique user identifier (can be any string, like your email or username)

```
OWNER_NAME
```
Your full name

---

### App Branding

```
VITE_APP_TITLE=Lifer App - Discover Your Primary Aim
VITE_APP_LOGO=/logo.svg
```

## Step 3: Install Dependencies

In the Replit Shell, run:

```bash
pnpm install
```

This will install all Node.js dependencies.

## Step 4: Set Up Database

Push the database schema to your database:

```bash
pnpm db:push
```

This creates all necessary tables in your database.

## Step 5: Configure Run Command

Replit should auto-detect the run command, but if not:

1. Click the **"Run"** button dropdown
2. Select **"Configure Run Button"**
3. Set command to:
```bash
pnpm dev
```

## Step 6: Start the Application

Click the **"Run"** button. The app will start on port 3000.

You should see:
```
Server running on http://localhost:3000/
[OAuth] Initialized with baseURL: https://api.manus.im
```

## Step 7: Access Your App

Click the **"Open in new tab"** button in Replit's webview to access your app.

## Step 8: Deploy to Production

1. Click the **"Deploy"** button in Replit
2. Choose deployment type:
   - **Autoscale**: Automatically scales based on traffic (recommended)
   - **Reserved VM**: Dedicated resources
3. Configure custom domain (optional)
4. Click **"Deploy"**

Your app will be live at `https://your-repl-name.repl.co`

## Troubleshooting

### Database Connection Fails

**Error:** `ECONNREFUSED` or `Connection timeout`

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check database provider's IP whitelist (add `0.0.0.0/0` for Replit)
3. Ensure SSL is enabled if required

### Module Not Found Errors

**Error:** `Cannot find module 'xyz'`

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
pnpm install
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
1. Stop the current process
2. Click "Run" again
3. Or change port in code if needed

### API Key Errors

**Error:** `Invalid API key` or `401 Unauthorized`

**Solution:**
1. Verify all API keys are set in Secrets
2. Check keys haven't expired
3. Ensure no extra spaces in secret values

### Build Errors

**Error:** TypeScript or build errors

**Solution:**
```bash
# Check for TypeScript errors
pnpm tsc --noEmit

# Clear Vite cache
rm -rf node_modules/.vite
pnpm dev
```

## Optional: Voice Configuration

If you want custom voices for meditation, add these ElevenLabs voice IDs:

```
VITE_MEDITATION_VOICE_MALE=your-voice-id
VITE_MEDITATION_VOICE_FEMALE=your-voice-id
VITE_MEDITATION_VOICE_NEUTRAL=your-voice-id
VITE_MR_MG_VOICE_ID=your-voice-id
```

Get voice IDs from: https://elevenlabs.io/voice-library

## Performance Tips

1. **Enable Always-On** (paid feature) to prevent cold starts
2. **Use connection pooling** for database (already configured)
3. **Enable caching** for static assets
4. **Monitor logs** for errors and performance issues

## Security Checklist

- [ ] All secrets are stored in Replit Secrets (not in code)
- [ ] Database uses SSL connection
- [ ] API keys are valid and not expired
- [ ] Storage bucket has proper access controls
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled (if needed)

## Next Steps

After deployment:
1. Test all features (chat, journal, meditation, etc.)
2. Set up monitoring and alerts
3. Configure custom domain
4. Set up backups for database
5. Monitor API usage and costs

## Support

- Replit Docs: https://docs.replit.com
- GitHub Issues: https://github.com/anehemy/lifer-app/issues
- Email: support@metamorphosisworldwide.com

---

**Congratulations!** Your Lifer App is now running on Replit! 🎉

