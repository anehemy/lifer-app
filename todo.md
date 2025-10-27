# Lifer App TODO

## CRITICAL BUGS - Fix Immediately
- [x] Chat continuity bug: Question should appear as MR. MG's message (assistant), not user message

## CRITICAL BUGS - Fix Immediately
- [x] Chat with Mr. MG should start fresh conversation, not add to existing
- [x] LLM invoke failed: 500 Internal Server Error - Added error handling and graceful fallback

## Fixed Bugs
- [x] Duplicate React keys error in Settings - multiple env vars have same voice ID

## New Feature Requests
- [x] Dynamic voice dropdowns: Read ElevenLabs voices from secret keys instead of hardcoding

## Fixed Bugs
- [x] STOP auto-playing voice responses (wasting API money)
- [x] Mute button must cancel ongoing TTS API requests
- [x] Prevent voice loops - only play once per message (already implemented with lastSpokenMessageRef)

## Current Sprint - New Feature Requests
- [x] Chat continuity: When clicking "Chat with Mr. MG" from journal, open chat with the same question as first message
- [x] Conversation history: Only save conversations where user sent at least one message
- [x] Conversation history: Add delete button for each conversation
- [x] Conversation history: Auto-name conversations based on topic discussed (AI-generated titles)
- [x] Add faster Google TTS voice options (increased speed to 1.1, added 16 voices)
- [x] Enable Mr. MG to merge similar/short journal entries upon request (function calling tool)

## Recently Completed
- [x] Make journal Mr. MG contextual like chat Mr. MG (analyze user data for questions)
- [x] Change "Ask Mr. MG for Guidance" button to "Chat with Mr. MG"
- [x] Auto-save journal entries from chat conversations (already implemented)

## Completed Features
- [x] Basic dashboard and navigation
- [x] Life Story (Journal) with guided questions
- [x] Pattern recognition and insights
- [x] Vision Board creation
- [x] Meditation generation with TTS
- [x] Primary Aim discovery
- [x] Voice selection for meditation (6 ElevenLabs voices)
- [x] Mr. MG character integration with "Ask Mr. MG" feature
- [x] AI-powered metadata extraction for journal entries
- [x] Editable metadata fields (time, place, experience, challenge, growth)
- [x] Dynamic timeline visualization with multiple views
- [x] Mobile-responsive collapsible sidebar
- [x] Story-based timeline (uses content time, not entry date)
- [x] Voice chat interface with Mr. MG
- [x] Voice input (speech-to-text) and output (text-to-speech)
- [x] ElevenLabs voice selector with custom voices (Mr MG, Mr MG Chatbot, Alan Nehemy)
- [x] Google Cloud TTS with 8 Neural2 voices
- [x] Browser TTS fallback
- [x] Voice provider cost management (admin settings)
- [x] Conversation history with session switching
- [x] Mobile-optimized chat with keyboard handling
- [x] Clickable dashboard stat cards
- [x] Admin-only settings (Voice Settings, Mr. MG Instructions)
- [x] Collapsible Mr. MG prompt textarea

## Deployment Preparation
- [ ] Verify Cloudflare Turnstile keys are entered in Manus UI Settings → Secrets
- [ ] Test login flow with Turnstile
- [ ] Create demo account with sample data for Michael Gerber
- [ ] Final testing across all features
- [ ] Save checkpoint and prepare for deployment

## Planned Features
- [ ] Enhanced Mr. MG personality and guidance system
- [ ] More sophisticated pattern analysis
- [ ] Export/share functionality for insights and meditations
- [ ] Offline support for viewing cached content
- [ ] PWA capabilities with service worker

