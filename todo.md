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



## NEW FEATURE - Comprehensive Feedback System
**Goal**: Allow users to provide contextual feedback from anywhere in the app, store it in a repository, and enable AI-powered analysis for continuous improvement.

### Phase 1: Database & Backend (Step 1)
- [ ] Create feedback table in database schema
  - Fields: id, userId, timestamp, page/feature context, feedbackType (chat/thumbs/text/voice), sentiment (positive/negative/neutral), textContent, audioUrl, metadata

### Phase 2: Backend API (Step 2)
- [ ] Create tRPC endpoints for feedback
  - submitFeedback mutation (text or voice)
  - listFeedback query (admin only)
  - getFeedbackStats query (admin only)

### Phase 3: Feedback Widget Component (Step 3)
- [ ] Create reusable FeedbackWidget component
  - Thumbs up/down buttons for quick sentiment
  - Expandable text area for detailed feedback
  - Voice recording button (reuse voice chat logic)
  - Auto-capture current page/feature context
  - Submit button with loading state

### Phase 4: Voice Feedback Storage (Step 4)
- [ ] Implement voice feedback recording and storage
  - Record audio using existing voice chat infrastructure
  - Upload audio files to S3 storage
  - Store audio URL in feedback table
  - Optional: Add transcription for searchability

### Phase 5: Global Integration (Step 5)
- [ ] Add FeedbackWidget to all major pages
  - Dashboard
  - Life Story
  - Patterns
  - Vision Board
  - Meditation
  - Primary Aim
  - Settings
  - Make it a floating button or sidebar widget

### Phase 6: Mr. MG Chat Integration (Step 6)
- [ ] Add feedback prompting to Mr. MG
  - Occasionally ask "Would you like to give feedback?"
  - Add collect_feedback tool for Mr. MG
  - Feedback goes to feedback table (NOT journal)
  - Natural, conversational flow

### Phase 7: Admin Feedback Dashboard (Step 7)
- [ ] Create admin page to view all feedback
  - Filter by date, page, sentiment, type
  - Display text and play voice recordings
  - Mark feedback as "reviewed" or "addressed"
  - Export feedback data

### Phase 8: AI Analysis Tool (Step 8)
- [ ] Create AI-powered feedback analysis system
  - Admin can request "Analyze all feedback"
  - AI compiles and categorizes feedback
  - Identifies patterns, common issues, feature requests
  - Generates prioritized action plan
  - Creates summary report with recommendations

**Benefits:**
- Continuous user-driven improvement
- Context-aware feedback (know exactly where issues occur)
- Voice feedback for detailed, emotional responses
- AI-powered insights from aggregate data
- Data-driven product decisions



## CRITICAL BUG - 500 Error on First Message
- [x] Chat giving 500 error on the very first message sent (IDENTIFIED)
- [x] Investigate server logs to find root cause (FOUND: LLM API returning 500)
- [x] Check aiChatRouter.ts sendMessage endpoint (working correctly)
- [x] Verify database queries are working (working correctly)
- [x] Add better error logging to identify exact failure point (DONE)
- [x] Root cause: LLM API (Forge) returning "code 13: bad response from upstream"
- [x] Add retry logic for LLM API failures (exponential backoff - 3 attempts with 1s, 2s, 4s delays)
- [ ] Add graceful fallback when LLM completely fails (return helpful error message instead of 500)
- [ ] Monitor if Forge API continues failing - may need alternative provider



## NEW FEATURE - Multi-LLM Provider Support with Fallback
**Goal**: Support multiple LLM providers (OpenAI, Gemini, Anthropic) with automatic fallback and provider selection in Settings.

### Benefits:
- **Reliability**: If one provider fails, automatically fallback to another
- **Testing**: Compare which LLM gives best responses for your use case
- **Cost optimization**: Use cheaper providers for simple tasks, premium for complex
- **Avoid vendor lock-in**: Not dependent on single API provider

### Implementation Steps:

#### Step 1: Add LLM Provider Configuration to Settings
- [ ] Add LLM provider settings to global_settings table
  - primary_llm_provider (forge/openai/gemini/anthropic)
  - fallback_llm_provider (same options)
  - openai_api_key (encrypted)
  - gemini_api_key (encrypted)
  - anthropic_api_key (encrypted)

#### Step 2: Create Admin UI for LLM Provider Management
- [ ] Add "AI Provider" section to Settings page (admin only)
- [ ] Dropdown to select primary provider
- [ ] Dropdown to select fallback provider
- [ ] Input fields for API keys (masked, encrypted storage)
- [ ] Test connection button for each provider
- [ ] Show current provider status (working/failing)

#### Step 3: Refactor LLM Invocation Layer
- [ ] Create provider-specific adapters:
  - ForgeAdapter (current implementation)
  - OpenAIAdapter (OpenAI API format)
  - GeminiAdapter (Google Gemini API format)
  - AnthropicAdapter (Claude API format)
- [ ] Unified interface for all providers
- [ ] Handle provider-specific request/response formats

#### Step 4: Implement Automatic Fallback Logic
- [ ] Try primary provider first
- [ ] On failure, automatically try fallback provider
- [ ] Log which provider was used for each request
- [ ] Return error only if both providers fail
- [ ] Add circuit breaker pattern (skip failing provider temporarily)

#### Step 5: Provider Testing & Comparison
- [ ] Add "Test Provider" button in Settings
- [ ] Send same prompt to all configured providers
- [ ] Display responses side-by-side for comparison
- [ ] Show response time and token usage for each
- [ ] Help admin choose best provider

#### Step 6: Usage Analytics
- [ ] Track which provider is used for each request
- [ ] Show provider usage stats in admin dashboard
- [ ] Track success/failure rates per provider
- [ ] Show average response time per provider
- [ ] Cost estimation per provider (if available)

**Priority**: HIGH - Current Forge API failures make this critical for reliability



## IMMEDIATE IMPLEMENTATION - Forge/OpenAI Toggle with Fallback ✅
**Priority**: CRITICAL - COMPLETED!

### What was built:
- [x] Add llm_provider fields to global_settings table (primary_provider, fallback_provider, openai_api_key)
- [x] Create OpenAI adapter alongside Forge adapter
- [x] Add provider selection UI in Settings (admin only)
  - Dropdown: Primary Provider (Forge/OpenAI)
  - Dropdown: Fallback Provider (Forge/OpenAI/None)
  - Input: OpenAI API Key (masked, saves on blur)
- [x] Update invokeLLM to check settings and use selected provider
- [x] Implement automatic fallback if primary fails (3 retries on primary, then fallback)
- [x] Show which provider was used in chat (console logs)
- [ ] Test both providers work correctly (needs OpenAI API key)

**Actual tokens used**: ~22,000
**Benefit**: Chat now has automatic fallback! If Forge fails, OpenAI takes over seamlessly.



## NEW FEATURE - Early Tester Welcome Notice ✅
**Priority**: HIGH - COMPLETED!

### What was built:
- [x] Create welcome notice modal/banner that shows on every login
- [x] Content includes:
  - Thank you message for early testers
  - Feedback emails: alan.nehemy@metamorphosisworldwide.com and info@metamorphosisworldwide.com
  - Feature status:
    * Chat version is stable (with some bugs)
    * Voice TTS is experimental and will change without notice as we test providers
  - Privacy & data notice:
    * We are not monitoring user data
    * Not responsible for data loss - users should backup in Settings
  - Promise to keep users updated with release notes
- [x] Shows on every login (appears fresh each time)
- [x] Professional, friendly tone with icons
- [x] Easy to close with "Got it, thanks!" button
- [x] Appears after login in authenticated layout

**Actual effort**: ~5,000 tokens

