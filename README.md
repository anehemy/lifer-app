# Lifer App - Discover Your Primary Aim

A comprehensive life management application that helps users discover their purpose through journaling, meditation, pattern analysis, and AI-powered insights.

## Features

- **AI Chat (Mr. MG)**: Conversational AI mentor for guidance and reflection
- **Life Story Journal**: Timeline visualization of life events, experiences, challenges, and growth
- **Interactive Bubble Visualization**: Hexagon-based experience clustering with value alignment
- **Pattern Analysis**: AI-powered detection of recurring themes in your life
- **Meditation**: Guided meditations with AI-generated audio
- **Vision Board**: Visual representation of goals and aspirations
- **Primary Aim**: Define and track your life's purpose

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Wouter (routing), shadcn/ui components
- **Backend**: Express 4, tRPC 11 (end-to-end type safety)
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: Manus OAuth (can be replaced with custom auth)
- **AI Integration**: OpenAI GPT-4, ElevenLabs (voice), Gemini
- **Storage**: S3-compatible object storage

## Prerequisites

- Node.js 22+ (recommended: use nvm)
- pnpm (package manager)
- MySQL or TiDB database
- OpenAI API key
- ElevenLabs API key (for meditation audio)
- S3-compatible storage (AWS S3, Cloudflare R2, etc.)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication (if using Manus OAuth)
JWT_SECRET=your-jwt-secret-here
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-app-id

# Owner Configuration
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Your Name

# AI Services
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...

# Storage (S3-compatible)
BUILT_IN_FORGE_API_URL=your-storage-api-url
BUILT_IN_FORGE_API_KEY=your-storage-api-key

# App Configuration
VITE_APP_TITLE=Lifer App - Discover Your Purpose
VITE_APP_LOGO=/logo.svg

# Voice IDs for Meditation (ElevenLabs)
VITE_MEDITATION_VOICE_MALE=voice-id-here
VITE_MEDITATION_VOICE_FEMALE=voice-id-here
VITE_MEDITATION_VOICE_NEUTRAL=voice-id-here
# ... (add other voice IDs as needed)
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/anehemy/lifer-app.git
cd lifer-app
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Database

```bash
# Push database schema
pnpm db:push

# (Optional) Seed initial data
# Create a seed script if needed
```

### 4. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
# Edit .env with your values
```

### 5. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Deployment

### Replit Deployment

1. **Import from GitHub**
   - Go to Replit.com
   - Click "Create Repl" → "Import from GitHub"
   - Enter repository URL: `https://github.com/anehemy/lifer-app`

2. **Configure Secrets**
   - In Replit, go to "Secrets" (lock icon in sidebar)
   - Add all environment variables from `.env`

3. **Set Run Command**
   - In `.replit` file or Replit config:
   ```
   run = "pnpm install && pnpm dev"
   ```

4. **Deploy**
   - Click "Run" to start the development server
   - Use Replit's deployment feature for production

### Other Platforms

- **Vercel**: Supports Node.js backends with Edge Functions
- **Railway**: Simple deployment with automatic HTTPS
- **Render**: Free tier available for full-stack apps
- **Fly.io**: Global deployment with Docker support

## Database Schema

The app uses the following main tables:

- `users`: User accounts and authentication
- `journal_entries`: Life story journal entries
- `meditations`: Meditation sessions and recordings
- `patterns`: AI-detected life patterns
- `vision_board_items`: Vision board goals and images

See `drizzle/schema.ts` for complete schema definition.

## Project Structure

```
lifer-app/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities and tRPC client
│   ├── public/            # Static assets
│   └── index.html         # HTML entry point
├── server/                # Backend Express + tRPC
│   ├── _core/             # Framework code (OAuth, context, etc.)
│   ├── routers.ts         # tRPC API routes
│   └── db.ts              # Database queries
├── drizzle/               # Database schema and migrations
│   └── schema.ts
├── shared/                # Shared types and constants
└── storage/               # S3 storage helpers
```

## Development Workflow

1. **Update Database Schema**
   - Edit `drizzle/schema.ts`
   - Run `pnpm db:push` to apply changes

2. **Add API Endpoints**
   - Define procedures in `server/routers.ts`
   - Use `publicProcedure` or `protectedProcedure`

3. **Build Frontend**
   - Create pages in `client/src/pages/`
   - Use `trpc.*.useQuery()` or `trpc.*.useMutation()` for API calls
   - Style with Tailwind CSS and shadcn/ui components

4. **Test**
   - Run `pnpm dev` and test in browser
   - Check browser console for errors
   - Monitor server logs for backend issues

## Troubleshooting

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Check database is accessible from your network
- Ensure SSL is enabled if required by your database

### Authentication Issues

- If using Manus OAuth, ensure `OAUTH_SERVER_URL` is correct
- For custom auth, replace OAuth logic in `server/_core/oauth.ts`

### API Errors

- Check server logs for detailed error messages
- Verify all required environment variables are set
- Ensure API keys (OpenAI, ElevenLabs) are valid

### Build Errors

- Clear `node_modules` and reinstall: `rm -rf node_modules && pnpm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check for TypeScript errors: `pnpm tsc --noEmit`

## Contributing

This is a personal project, but contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Private project - All rights reserved

## Support

For questions or issues:
- Email: support@metamorphosisworldwide.com
- GitHub Issues: https://github.com/anehemy/lifer-app/issues

## Acknowledgments

- Built with the Manus web development template
- UI components from shadcn/ui
- AI powered by OpenAI and Google Gemini
- Voice synthesis by ElevenLabs

