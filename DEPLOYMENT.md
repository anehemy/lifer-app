# Deployment Guide

## Required Environment Variables

When deploying to Replit or another platform, you'll need to configure these environment variables:

### Database
- `DATABASE_URL` - MySQL/TiDB connection string (format: `mysql://user:password@host:port/database`)

### Authentication
- `JWT_SECRET` - Random secret for JWT token signing
- `OWNER_OPEN_ID` - Your user identifier
- `OWNER_NAME` - Your full name

### AI Services
- `OPENAI_API_KEY` - OpenAI API key (starts with `sk-`)
- `GEMINI_API_KEY` - Google Gemini API key
- `ELEVENLABS_API_KEY` - ElevenLabs API key for voice synthesis

### Storage
- Configure S3-compatible storage credentials for file uploads

### App Configuration
- `VITE_APP_TITLE` - Application title
- `VITE_APP_LOGO` - Logo URL or path

## Replit Deployment Steps

1. **Import Repository**
   ```
   - Go to Replit.com
   - Click "Create Repl" → "Import from GitHub"
   - Enter: https://github.com/anehemy/lifer-app
   ```

2. **Configure Secrets**
   ```
   - Click the lock icon (Secrets) in Replit sidebar
   - Add each environment variable listed above
   - Paste your actual values (not the placeholders)
   ```

3. **Install Dependencies**
   ```bash
   pnpm install
   ```

4. **Set Up Database**
   ```bash
   pnpm db:push
   ```

5. **Run Application**
   ```bash
   pnpm dev
   ```

6. **Deploy to Production**
   ```
   - Use Replit's "Deploy" button
   - Configure custom domain if needed
   - Enable always-on for production
   ```

## Database Setup

### Option 1: TiDB Cloud (Recommended)
- Free tier available
- MySQL-compatible
- Serverless scaling
- Sign up at: https://tidbcloud.com

### Option 2: PlanetScale
- Free tier with 5GB storage
- MySQL-compatible
- Easy branching
- Sign up at: https://planetscale.com

### Option 3: Railway MySQL
- Simple setup
- Pay-as-you-go
- Sign up at: https://railway.app

## Storage Setup

### Option 1: Cloudflare R2
- S3-compatible
- Free tier: 10GB storage
- No egress fees
- Sign up at: https://cloudflare.com/r2

### Option 2: AWS S3
- Industry standard
- Pay-as-you-go
- Sign up at: https://aws.amazon.com/s3

### Option 3: Backblaze B2
- S3-compatible
- Affordable pricing
- Sign up at: https://backblaze.com/b2

## API Keys Setup

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy and add to `OPENAI_API_KEY`

### ElevenLabs
1. Go to https://elevenlabs.io/api
2. Generate API key
3. Copy and add to `ELEVENLABS_API_KEY`

### Google Gemini
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy and add to `GEMINI_API_KEY`

## Security Checklist

- [ ] All API keys are stored as secrets (not in code)
- [ ] Database uses SSL connection
- [ ] JWT_SECRET is a strong random string
- [ ] Storage bucket has proper access controls
- [ ] CORS is configured for your domain only
- [ ] Rate limiting is enabled
- [ ] Error messages don't expose sensitive info

## Monitoring

After deployment, monitor:
- Application logs for errors
- Database connection pool usage
- API rate limits and quotas
- Storage usage and costs
- Response times and performance

## Troubleshooting

### Database Connection Fails
- Verify DATABASE_URL format
- Check IP whitelist in database provider
- Ensure SSL is enabled if required

### API Errors
- Verify all API keys are set correctly
- Check API quotas and billing
- Review API provider status pages

### Storage Issues
- Verify S3 credentials
- Check bucket permissions
- Ensure CORS is configured

## Support

For deployment issues:
- Check Replit documentation: https://docs.replit.com
- GitHub Issues: https://github.com/anehemy/lifer-app/issues
- Email: support@metamorphosisworldwide.com

