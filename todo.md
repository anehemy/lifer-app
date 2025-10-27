# Lifer App TODO

## CRITICAL BUGS - Fix Immediately
- [x] Chat continuity bug: Question should appear as MR. MG's message (assistant), not user message

## CRITICAL BUGS - Fix Immediately
- [ ] Voice settings architecture: Move from per-user to global admin settings (IN PROGRESS)
  - [x] Create global_settings table
  - [x] Fix duplicate router error in server/routes.ts
  - [x] Create tRPC endpoints (globalSettings.getAll, globalSettings.updateVoiceSettings)
  - [x] Update Settings.tsx to use global settings
  - [x] Update useVoiceChat.ts to read from global settings
  - [x] Add admin-only UI restrictions to voice settings section (already implemented)
  - [ ] Test voice settings changes apply globally to all users (ready for testing)
  - [ ] Create migration to remove voice fields from users table (after testing)
- [x] Voice dropdown positioning broken on mobile (removed position="popper", kept max-height)

## Fixed Bugs
- [x] Bubble dragging causes page behind to scroll/move
- [x] User messages appearing duplicated in chat (removed duplicate save call)
- [x] Voice changes in settings not applying to chat (now reads from user database)
- [ ] Audio file upload: Current file display not refreshing after upload (shows old filename)
- [ ] Audio file upload: Add save button to confirm upload success
- [ ] ElevenLabs selector: Selecting one voice selects multiple (Domi/Elli/Mr MG share same ID)
- [ ] LLM 500 error: Still occurring in chat
- [ ] Delete meditation not working - recording doesn't disappear
- [ ] Chat should show journal question when opened directly (not just from journal page)

## Fixed Bugs
- [x] Chat bubble: Make draggable - overlaps with "Made with Manus" badge on mobile

## Fixed Bugs
- [x] Chat bubble: Cannot move/drag around screen, overlaps with menu (moved to right side)
- [x] Chat: User message doesn't appear until Mr. MG replies (now saved immediately)
- [x] Voice settings: Not syncing across devices (desktop vs phone)

## Fixed Bugs
- [x] Intro audio URL not persisting - uses localStorage instead of database (resets on new device/deployment)

## Feature Improvements Needed
- [ ] Improve Primary Aim AI behavior
- [ ] Add settings instructions for Primary Aim AI customization

## Fixed Bugs
- [x] Storage upload endpoint missing - returns HTML instead of JSON

## Fixed Bugs
- [x] Chat opens blank when clicking "Chat with Mr. MG" from journal

## New Feature Requests
- [x] Add audio file upload in Settings for Mr. MG's "Start Here" introduction

## Fixed Bugs
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



## CRITICAL BUGS - Mobile UI
- [x] Voice dropdown on mobile: Screen jumps/changes when dropdown opens in Settings page (fixed with position="popper")



## CRITICAL BUGS - Chat Issues
- [x] 500 error occurring in chat after multiple back-and-forth messages (increased context window to 20 messages)
- [x] Investigate LLM API failures and add better error handling/retry logic (already has try-catch with fallback)

## New Feature Requests - Conversation Summaries
- [x] Add conversation summary feature: Mr. MG should ask if user wants to save a summary after meaningful discussions
- [x] Implement "save summary" function that creates a journal entry from conversation
- [x] Mr. MG can now detect when a conversation topic is concluding and offer to summarize
- [x] Summary captures key insights, reflections, and action items from the conversation
- [ ] Update Mr. MG's system prompt in Settings to include guidance about offering summaries



## New Feature Request - Message Limit Notification
- [x] Mr. MG should proactively notify user when approaching message limit (15-18 messages)
- [x] Offer to save conversation summary before limit is reached
- [x] Suggest starting a fresh conversation to continue the discussion
- [x] Update Mr. MG's system prompt with this guidance (automatic at 15+ messages)



## CRITICAL BUG - Pattern Detection
- [x] Journal entry context extraction not working - Experience, Challenge, Growth fields remain "Not specified"
- [x] AI should automatically extract these from user's response text
- [x] Improve pattern detection to identify:
  - Experience: What the user is going through or describing
  - Challenge: The difficulty or obstacle mentioned
  - Growth: Insights, realizations, or learning mentioned
- [x] Update journal entry creation to use LLM for context extraction (added to all 3 Mr. MG tools)



## CRITICAL BUGS - Chat Message Loss & Errors
- [x] Messages disappear when chat errors occur - user loses everything they typed (FIXED)
- [x] Add client-side message persistence (localStorage) to prevent message loss (DONE)
- [x] Increase message limit from 20 to 50 messages for longer conversations (DONE - now 50 messages, warns at 40)
- [x] Add better error handling with retry logic (message preserved on error, user can retry)
- [x] Show user-friendly error messages with option to retry (improved error messages)
- [ ] Chat communication errors happening frequently - investigate root cause
- [ ] Add retry button in error toast for failed messages

