# Environment Variables Reference

Complete list of all environment variables needed for the Lifer App.

## 🔴 Required (Critical)

These must be set for the app to function:

### Database
```
DATABASE_URL=mysql://username:password@hostname:3306/database_name
```
MySQL/TiDB connection string. Required for all data storage.

**Get it from:**
- TiDB Cloud: https://tidbcloud.com (recommended)
- PlanetScale: https://planetscale.com
- Railway: https://railway.app

---

### Authentication
```
JWT_SECRET=your-random-secret-here
```
Secret key for signing JWT tokens. Must be a long random string.

**Generate one:**
```bash
openssl rand -base64 32
```

---

### AI Services
```
OPENAI_API_KEY=sk-...
```
OpenAI API key for AI chat and insights.

**Get it from:** https://platform.openai.com/api-keys

---

## 🟡 Highly Recommended

These enable core features:

### Voice Synthesis
```
ELEVENLABS_API_KEY=your-elevenlabs-key
```
For natural voice responses in chat and meditation.

**Get it from:** https://elevenlabs.io/api

---

```
GOOGLE_CLOUD_TTS_API_KEY=your-google-key
```
Alternative voice provider (more affordable than ElevenLabs).

**Get it from:** https://console.cloud.google.com/apis/credentials

---

### Storage
```
BUILT_IN_FORGE_API_URL=https://your-storage-endpoint
BUILT_IN_FORGE_API_KEY=your-storage-key
```
S3-compatible storage for file uploads (images, audio, etc.)

**Options:**
- Cloudflare R2: https://cloudflare.com/r2 (recommended, free tier)
- AWS S3: https://aws.amazon.com/s3

---

## 🟢 Optional (Enhancements)

### Additional AI Provider
```
GEMINI_API_KEY=your-gemini-key
```
Google Gemini for additional AI capabilities.

**Get it from:** https://makersuite.google.com/app/apikey

---

### Owner Configuration
```
OWNER_OPEN_ID=your-email@example.com
OWNER_NAME=Your Full Name
```
Identifies the app owner (admin user).

---

### App Branding
```
VITE_APP_TITLE=Lifer App - Discover Your Primary Aim
VITE_APP_LOGO=/logo.svg
VITE_APP_ID=lifer-app
```
Customizes the app name and logo.

---

### Voice Customization
```
VITE_MR_MG_VOICE_ID=your-voice-id
```
Custom ElevenLabs voice for Mr. MG (AI mentor).

**Get voice IDs from:** https://elevenlabs.io/voice-library

---

```
VITE_MEDITATION_VOICE_MALE=voice-id-1
VITE_MEDITATION_VOICE_FEMALE=voice-id-2
VITE_MEDITATION_VOICE_NEUTRAL=voice-id-3
VITE_MEDITATION_VOICE_RACHEL=voice-id-4
VITE_MEDITATION_VOICE_BELLA=voice-id-5
VITE_MEDITATION_VOICE_ELLI=voice-id-6
VITE_MEDITATION_VOICE_DOMI=voice-id-7
VITE_MEDITATION_VOICE_ANTONI=voice-id-8
VITE_MEDITATION_VOICE_JOSH=voice-id-9
```
Multiple voice options for meditation sessions.

---

### OAuth Configuration (Manus Platform)
```
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```
Only needed if using Manus OAuth. For Replit, you can implement your own auth.

---

### Analytics (Optional)
```
VITE_ANALYTICS_ENDPOINT=https://your-analytics-endpoint
VITE_ANALYTICS_WEBSITE_ID=your-site-id
```
For tracking user engagement.

---

### Turnstile (Bot Protection)
```
CLOUDFLARE_TURNSTILE_SITE_KEY=your-site-key
CLOUDFLARE_TURNSTILE_SECRET_KEY=your-secret-key
```
Cloudflare Turnstile for bot protection.

**Get it from:** https://dash.cloudflare.com/turnstile

---

## 📋 Quick Setup Checklist

### Minimum Viable Setup (3 variables)
- [ ] `DATABASE_URL` - Database connection
- [ ] `JWT_SECRET` - Authentication security
- [ ] `OPENAI_API_KEY` - AI features

### Recommended Setup (6 variables)
- [ ] All minimum variables above
- [ ] `ELEVENLABS_API_KEY` - Voice features
- [ ] `BUILT_IN_FORGE_API_URL` - File storage
- [ ] `BUILT_IN_FORGE_API_KEY` - Storage auth

### Full Setup (All features)
- [ ] All recommended variables above
- [ ] `GOOGLE_CLOUD_TTS_API_KEY` - Alternative voice
- [ ] `GEMINI_API_KEY` - Additional AI
- [ ] Voice customization variables
- [ ] Branding variables
- [ ] Analytics (if desired)

---

## 🔒 Security Best Practices

1. **Never commit secrets to git**
   - Use `.env` file locally (already in `.gitignore`)
   - Use Replit Secrets in production

2. **Rotate keys regularly**
   - Change `JWT_SECRET` every 90 days
   - Monitor API key usage

3. **Use environment-specific keys**
   - Different keys for development/production
   - Separate databases for testing

4. **Limit API key permissions**
   - Only grant necessary scopes
   - Use read-only keys where possible

5. **Monitor usage**
   - Set up billing alerts
   - Track API consumption

---

## 📝 Example .env File

For local development, create `.env` in project root:

```bash
# Database
DATABASE_URL=mysql://user:pass@localhost:3306/lifer_dev

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# AI Services
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
GOOGLE_CLOUD_TTS_API_KEY=...

# Storage
BUILT_IN_FORGE_API_URL=https://...
BUILT_IN_FORGE_API_KEY=...

# Owner
OWNER_OPEN_ID=admin@example.com
OWNER_NAME=Admin User

# Branding
VITE_APP_TITLE=Lifer App (Dev)
VITE_APP_LOGO=/logo.svg

# Voice
VITE_MR_MG_VOICE_ID=...
```

**Remember:** Never commit this file to git!

---

## 🚀 Deployment-Specific Notes

### Replit
- Set all variables in **Secrets** (lock icon 🔒)
- Secrets are encrypted and never exposed in logs
- Can reference secrets in code via `process.env.VARIABLE_NAME`

### Vercel
- Set in **Project Settings → Environment Variables**
- Separate variables for Production/Preview/Development
- Automatically injected at build time

### Railway
- Set in **Variables** tab
- Can reference other variables: `$DATABASE_URL`
- Supports shared variables across services

### Docker
- Use `.env` file with `docker-compose`
- Or pass via `-e` flag: `docker run -e DATABASE_URL=...`
- Use secrets management in production

---

## ❓ Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` format
- Verify database is accessible from deployment platform
- Check IP whitelist settings

### "Invalid API key"
- Verify key is correct (no extra spaces)
- Check key hasn't expired
- Ensure key has necessary permissions

### "Module not found" errors
- Some packages need environment variables at build time
- Prefix with `VITE_` for frontend access
- Restart dev server after changing variables

### Voice features not working
- Check both ElevenLabs AND Google TTS keys
- Verify voice IDs are valid
- Check API quota/billing

---

## 📞 Support

Need help with environment variables?
- Email: support@metamorphosisworldwide.com
- GitHub Issues: https://github.com/anehemy/lifer-app/issues

---

**Last Updated:** 2025-01-05

