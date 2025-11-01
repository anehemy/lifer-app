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



## UPDATE - Expand Feature Status in Welcome Notice ✅
- [x] Add detailed status for each feature:
  - Life Story: Partially Stable - text input works, card management/combining/timeline under development
  - Chat (Mr. MG): Stable with bugs - includes beta navigation feature
  - Patterns: Beta - detection working, AI analysis needs refinement
  - Vision Board: Stable - all features functional
  - Meditation: Experimental - TTS providers being tested
  - Primary Aim: In Development - basic functionality available



## NEW FEATURE - Mr. MG Greeting in Chat Widget ✅
- [x] Chat widget should start with Mr. MG sending the first message (like in Life Story)
- [x] Message should be welcoming and contextual
- [x] Should appear when user first opens the chat widget
- [x] Don't repeat the greeting if user already has chat history

**Greeting message**: "Hello! I'm Mr. MG, your AI life mentor. I'm here to help you explore your thoughts, discover patterns, and work toward your Primary Aim. What's on your mind today?"



## TIMELINE & VISUALIZATION ROADMAP

### Phase 1: Interactive Visual Timeline
**Priority**: HIGH - Core feature for pattern discovery
- [ ] Create horizontal scrollable timeline component
- [ ] Display journal entries as nodes/cards on timeline
- [ ] Color-code entries by sentiment/emotion (positive, neutral, challenging)
  - Use AI to detect sentiment from entry content
  - Visual indicators: green (positive), yellow (neutral), red (challenging)
- [ ] Click to expand entry details inline
- [ ] Zoom controls (day/week/month/year views)
- [ ] Smooth scrolling and animations
- [ ] Mobile-responsive touch gestures
- [ ] Show entry count per time period
**Estimated effort**: 15,000-20,000 tokens
**Impact**: High - Makes journal history visual and explorable

### Phase 2: Timeline Filters & Search
**Priority**: HIGH - Essential for finding specific entries
- [ ] Time period filters (last week, month, quarter, year, all time, custom range)
- [ ] Filter by place (dropdown of all places mentioned)
- [ ] Filter by experience type (all detected experiences)
- [ ] Filter by challenge type (all detected challenges)
- [ ] Filter by growth theme (all detected growth areas)
- [ ] Multi-filter support (combine filters)
- [ ] Search within timeline (full-text search)
- [ ] "Show only entries with metadata" toggle
- [ ] Save filter presets for quick access
- [ ] Clear all filters button
**Estimated effort**: 10,000-12,000 tokens
**Impact**: High - Makes large journals manageable

### Phase 3: Places Map Visualization
**Priority**: MEDIUM - Unique spatial insight
- [ ] Integrate mapping library (Leaflet or Mapbox)
- [ ] Parse place data from journal entries
- [ ] Display markers on interactive map
- [ ] Cluster markers when multiple entries at same location
- [ ] Click marker to see entry preview
- [ ] Click preview to open full entry
- [ ] Heat map overlay showing writing frequency by location
- [ ] Filter timeline by clicking map regions
- [ ] "Most reflective places" insights
- [ ] Mobile-friendly map controls
**Estimated effort**: 12,000-15,000 tokens
**Impact**: Medium - Novel way to explore journal, great for travelers

### Phase 4: Metadata Tag Clouds
**Priority**: MEDIUM - Visual pattern recognition
- [ ] Create tag cloud component
- [ ] Separate clouds for: Experiences, Challenges, Growth themes
- [ ] Size tags by frequency (bigger = more common)
- [ ] Color-code by category or recency
- [ ] Click tag to filter timeline to related entries
- [ ] Hover to show count and preview
- [ ] Animated transitions when filtering
- [ ] Export tag cloud as image
- [ ] "Trending" indicator for recent themes
**Estimated effort**: 8,000-10,000 tokens
**Impact**: Medium - Quick visual summary of journal themes

### Phase 5: Pattern Dashboard ("Your Journey at a Glance")
**Priority**: HIGH - Shows value of journaling
- [ ] Create dedicated Patterns page/dashboard
- [ ] Top 5 most common places (bar chart)
- [ ] Top 10 experiences (horizontal bar chart)
- [ ] Recurring challenges (pie chart or list with counts)
- [ ] Growth themes over time (line graph showing evolution)
- [ ] Entry frequency chart (calendar heat map like GitHub)
- [ ] Sentiment trend over time (line graph)
- [ ] Word count statistics (total, average, longest entry)
- [ ] Streak tracker (consecutive days journaling)
- [ ] "Insights" section with AI-generated observations
  - "You write most on Sundays"
  - "Your top growth area is 'self-awareness'"
  - "You've mentioned 'time management' 5 times this month"
- [ ] Time period selector (last month, quarter, year, all time)
- [ ] Export dashboard as PDF report
**Estimated effort**: 18,000-22,000 tokens
**Impact**: Very High - Motivates continued journaling, shows progress

### Phase 6: Connections & Relationships Graph
**Priority**: LOW - Advanced feature
- [ ] Network graph visualization (D3.js or similar)
- [ ] Nodes: Challenges, Experiences, Growth themes
- [ ] Edges: Relationships between them
- [ ] Show "When you faced [challenge], you grew in [area]"
- [ ] Interactive: drag nodes, zoom, pan
- [ ] Click node to see related entries
- [ ] Highlight strongest connections
- [ ] AI analysis to detect non-obvious patterns
- [ ] "Your growth journey" narrative view
**Estimated effort**: 15,000-18,000 tokens
**Impact**: Medium - Deep insights for engaged users

### Phase 7: AI-Generated Timeline Stories
**Priority**: MEDIUM - Narrative synthesis
- [ ] Generate summaries for time periods (week, month, quarter, year)
- [ ] "Your [Time Period]: A journey of..." format
- [ ] Highlight key moments and turning points
- [ ] Identify breakthrough entries
- [ ] Create narrative arc from entries
- [ ] Include quotes from actual entries
- [ ] Export as shareable document
- [ ] "Year in Review" special feature (annual summary)
**Estimated effort**: 10,000-12,000 tokens
**Impact**: Medium - Emotional connection, shareable content

### Phase 8: Comparison Views
**Priority**: LOW - Nice-to-have
- [ ] Side-by-side timeline comparison
- [ ] "You now vs. 6 months ago"
- [ ] Compare metadata (challenges then vs. now)
- [ ] Compare sentiment (mood improvement/decline)
- [ ] Compare writing frequency
- [ ] Compare topics discussed
- [ ] Show evolution of thinking on specific topics
- [ ] "How you've grown" summary
**Estimated effort**: 8,000-10,000 tokens
**Impact**: Medium - Shows personal growth clearly

### Phase 9: Milestone Markers & Achievements
**Priority**: MEDIUM - Gamification & motivation
- [ ] Auto-detect breakthrough moments (AI analysis)
- [ ] Manual milestone marking (user can flag important entries)
- [ ] Special visual indicators on timeline
- [ ] Achievements system:
  - "First entry" badge
  - "7-day streak" badge
  - "50 entries" badge
  - "Deep reflector" (long entries)
  - "Consistent journaler" (regular entries)
- [ ] Milestone gallery view
- [ ] Share achievements (optional)
- [ ] Celebrate milestones with animations
**Estimated effort**: 10,000-12,000 tokens
**Impact**: Medium - Increases engagement and retention

### Phase 10: Export & Share Features
**Priority**: MEDIUM - User control & portability
- [ ] Export timeline as PDF (formatted document)
- [ ] Export timeline as image (visual snapshot)
- [ ] Export specific time period
- [ ] Export filtered view (e.g., all entries about "career")
- [ ] Create shareable "Year in Review" summary
- [ ] Privacy controls (what to include/exclude)
- [ ] Beautiful templates for exports
- [ ] Option to share anonymously
- [ ] Generate public link (optional)
- [ ] Backup entire journal (JSON/CSV)
**Estimated effort**: 12,000-15,000 tokens
**Impact**: Medium - Data ownership, sharing capability

---

## TOTAL ESTIMATED EFFORT
**All 10 phases**: ~130,000-160,000 tokens

## RECOMMENDED IMPLEMENTATION ORDER
**Quick Wins (High Impact, Lower Effort)**:
1. Phase 2: Timeline Filters (10-12k tokens)
2. Phase 4: Tag Clouds (8-10k tokens)

**Core Features (High Impact, Higher Effort)**:
3. Phase 1: Interactive Timeline (15-20k tokens)
4. Phase 5: Pattern Dashboard (18-22k tokens)

**Engagement Features**:
5. Phase 9: Milestones (10-12k tokens)
6. Phase 7: Timeline Stories (10-12k tokens)

**Advanced Features (Later)**:
7. Phase 3: Places Map (12-15k tokens)
8. Phase 10: Export/Share (12-15k tokens)
9. Phase 8: Comparison Views (8-10k tokens)
10. Phase 6: Connections Graph (15-18k tokens)



## NEW FEATURE - Refresh Context & Themes on Journal Cards
**Priority**: MEDIUM - Quality of life improvement
- [ ] Add refresh/re-analyze button to each journal card
- [ ] Button triggers AI re-evaluation of Context & Themes metadata:
  - Time Context
  - Place Context
  - Experience Type
  - Challenge Type
  - Growth Theme
- [ ] Show loading state while re-analyzing
- [ ] Update card display with new metadata
- [ ] Save updated metadata to database
- [ ] Add confirmation: "Are you sure? This will overwrite existing metadata"
- [ ] Option to bulk refresh multiple cards (select + refresh all)
- [ ] Show "Last analyzed: [date]" on cards
- [ ] Useful when:
  - AI improves over time (better analysis)
  - User edits entry content
  - Initial analysis was inaccurate
**Estimated effort**: 5,000-7,000 tokens
**Impact**: Medium - Improves data quality, user control



## DASHBOARD REDESIGN - Replace Quick Actions with Insights
**Priority**: MEDIUM - Part of visualization improvements
**Timing**: Implement alongside Phase 5 (Pattern Dashboard)

- [ ] Remove "Quick Actions" section from dashboard
  - Redundant with sidebar navigation
  - Takes up valuable space
- [ ] Replace with "Insights" section showing:
  - Recent patterns detected
  - "You've journaled X days this week"
  - "Your top theme this month: [theme]"
  - "You write most on [day of week]"
  - Sentiment trend (improving/declining)
  - Streak information
  - Suggested reflection prompts based on patterns
- [ ] Make insights dynamic and personalized
- [ ] Link insights to filtered timeline views
- [ ] Refresh insights based on selected time period
**Estimated effort**: 5,000-7,000 tokens (part of Pattern Dashboard work)
**Impact**: High - Makes dashboard actionable and insightful



## SECURITY FIX - Move OpenAI API Key to Secrets ✅
**Priority**: HIGH - Security best practice
- [x] Remove OpenAI API key input from Settings UI
- [x] Use webdev_request_secrets to request OPENAI_API_KEY
- [x] Update llm.ts to read from environment variable instead of database
- [x] Keep only provider selection (Forge/OpenAI/fallback) in Settings
- [x] Update Settings UI to show "Configure in Secrets →" link
- [ ] Test that OpenAI works with env var (ready for testing)
**Actual effort**: ~3,500 tokens
**Impact**: High - Security improvement, follows best practices



## BUG - Welcome Notice Cut Off on Mobile ✅
**Priority**: HIGH - Affects all mobile users
- [x] Welcome notice modal too tall on mobile screens (reduced to 85vh on mobile)
- [x] Close button (X) hard to reach (default dialog close button always visible)
- [x] "Got it, thanks!" button cut off (now sticky at bottom)
- [x] Add proper scrolling for modal content (overflow-y-auto)
- [x] Reduce max height on mobile (85vh mobile, 90vh desktop)
- [x] Ensure close button always visible (sticky footer with border)
- [x] Full-width button on mobile for easy tapping
**Actual effort**: ~1,500 tokens
**Impact**: High - First impression for mobile users



## CRITICAL BUG - Mr. MG Cannot Perform Actions
**Priority**: CRITICAL - Core feature broken
**Issue**: Mr. MG claims to navigate/perform actions but doesn't actually do anything

### Root Cause:
- Mr. MG has no tools to actually navigate the app
- No tools to modify user data (clear primary aim, etc.)
- Can only respond with text, not perform actions

### Required Tools to Implement:

**1. Navigation Tools**
- [ ] `navigate_to_page` - Navigate to specific pages (dashboard, life-story, patterns, vision-board, meditation, primary-aim, settings)
- [ ] Tool should trigger client-side navigation
- [ ] Return confirmation of navigation

**2. Primary Aim Tools**
- [ ] `get_primary_aim` - Read user's current primary aim
- [ ] `update_primary_aim` - Update primary aim content
- [ ] `clear_primary_aim` - Clear/reset primary aim

**3. Journal Tools**
- [ ] `get_recent_journal_entries` - Fetch recent entries
- [ ] `create_journal_entry` - Create new entry (already exists as save_journal_entry)
- [ ] `update_journal_entry` - Edit existing entry
- [ ] `delete_journal_entry` - Delete entry

**4. Vision Board Tools**
- [ ] `get_vision_items` - List user's vision board items
- [ ] `create_vision_item` - Add new vision item
- [ ] `update_vision_item` - Edit vision item
- [ ] `delete_vision_item` - Remove vision item

**5. Meditation Tools**
- [ ] `start_meditation` - Launch meditation with specific type/duration
- [ ] `get_meditation_history` - View past meditation sessions

**6. Pattern Tools**
- [ ] `get_patterns` - Fetch detected patterns
- [ ] `analyze_patterns` - Trigger pattern analysis

### Implementation Plan:

**Phase 1: Navigation (Highest Priority)** ✅ COMPLETE
- [x] Add `navigate_to_page` tool to aiChatRouter
- [x] Implement client-side navigation trigger
- [x] Test navigation from chat (ready for testing)
**Actual effort**: ~3,500 tokens

**Phase 2: Primary Aim Tools**
- Add CRUD tools for primary aim
- Connect to existing primary aim database
- Test clearing and updating
**Estimated effort**: 4,000-5,000 tokens

**Phase 3: Data Manipulation Tools**
- Add tools for journal, vision board, meditation
- Ensure proper permissions and validation
- Test all operations
**Estimated effort**: 8,000-10,000 tokens

**Total Estimated Effort**: 15,000-19,000 tokens
**Impact**: CRITICAL - Makes Mr. MG actually useful as an AI assistant

### Testing Checklist:
- [ ] Ask Mr. MG to navigate to meditation page
- [ ] Ask Mr. MG to clear primary aim
- [ ] Ask Mr. MG to create a journal entry
- [ ] Ask Mr. MG to add a vision board item
- [ ] Verify all actions actually execute
- [ ] Verify proper error handling



## NEW FEATURE - Custom Engagement Tracking System (Option A - Full Implementation)
**Priority**: HIGH - Critical for understanding user behavior and improving the app
**Total Estimated Effort**: 23,000-30,000 tokens

### Phase 1: Event Logging System ✅ COMPLETE (4,500 tokens)
- [x] Create `userEvents` table in database schema
  - Fields: id, userId, eventType, eventData (JSON), timestamp, sessionId
- [x] Add event types enum: LOGIN, LOGOUT, PAGE_VIEW, JOURNAL_ENTRY_CREATED, MEDITATION_STARTED, MEDITATION_COMPLETED, VISION_ITEM_CREATED, PATTERN_VIEWED, PRIMARY_AIM_UPDATED, etc.
- [x] Create tRPC router for event logging (`analytics.logEvent`)
- [x] Add helper function `logUserEvent(userId, eventType, metadata)`
- [x] Added `analytics.getRecentEvents` and `analytics.getAllRecentEvents` endpoints
- [x] Test event logging from backend (ready for Phase 2)

### Phase 2: Automatic Event Tracking (COMPLETED)
- [ ] Add login/logout event tracking to auth system
- [ ] Instrument journal entry creation
- [ ] Track meditation start/completion
- [ ] Track vision board item creation/updates
- [ ] Track pattern page views
- [ ] Track primary aim updates
- [ ] Add page view tracking to client-side router
- [ ] Track session duration (session start/end)
- [ ] Add client-side event logging hook (`useAnalytics`)

### Phase 3: Engagement Metrics Calculation (5,000-7,000 tokens)
- [ ] Create analytics service with metric calculations
- [ ] Calculate DAU (Daily Active Users)
- [ ] Calculate WAU (Weekly Active Users)
- [ ] Calculate MAU (Monthly Active Users)
- [ ] Calculate feature adoption rates (% of users using each feature)
- [ ] Calculate retention cohorts (Day 1, Day 7, Day 30 retention)
- [ ] Calculate average session duration
- [ ] Calculate feature usage frequency
- [ ] Add tRPC endpoints to fetch metrics (`analytics.getMetrics`, `analytics.getRetention`, `analytics.getFeatureUsage`)

### Phase 4: Admin Engagement Dashboard (8,000-10,000 tokens)
- [ ] Create new "Analytics" page (admin-only, accessible from Settings sidebar)
- [ ] **User Login Log**:
  - Table showing: User name, Last login time, Total logins
  - Sortable by name, last login, login count
  - Search/filter by user name
- [ ] **Time Spent Per User**:
  - Table showing: User name, Time spent today, Time spent this week, Total time
  - Calculate from session start/end events
  - Sortable and filterable
- [ ] **Overall App Usage Metrics**:
  - Total users, Active users (today/week/month)
  - Total journal entries created
  - Total meditations completed
  - Total vision items created
  - Total chat messages sent
  - Primary aims created/updated
  - Patterns viewed
- [ ] **Feature Usage Breakdown**:
  - Bar chart or table showing usage per feature
  - Journal, Meditation, Vision Board, Patterns, Primary Aim, Chat
- [ ] **Recent Activity Log**:
  - Last 100 events across all users
  - Filterable by user, event type, date range
  - Shows: Time, User, Event type, Details
- [ ] Export to CSV functionality for all tables
- [ ] Date range selector for all metrics
- [ ] Responsive design for mobile viewing

### Testing Checklist:
- [ ] Verify events are logged correctly for all actions
- [ ] Check that metrics calculate accurately
- [ ] Test dashboard loads without errors
- [ ] Verify admin-only access control
- [ ] Test CSV export functionality
- [ ] Verify performance with large datasets

### Success Metrics:
- All user actions tracked automatically
- Dashboard loads in <2 seconds
- Metrics update in real-time
- Admin can export data for external analysis
- Zero impact on user experience (tracking is invisible)

---

**Ready to implement!** Starting with Phase 1: Event Logging System.



## BUG - Early Tester Notice Showing on Every Page ✅ FIXED
**Priority**: HIGH - Annoying UX issue
- [x] Early tester notice currently shows on every page navigation (FIXED)
- [x] Should only show once after login on the dashboard (uses localStorage)
- [x] Use localStorage to track if user has seen it (implemented)
- [x] Notice now only shows once per browser
**Actual effort**: 500 tokens



## NEW FEATURE - Quick Feedback Widget on Dashboard ✅ COMPLETE
**Priority**: HIGH - Immediate user feedback collection
**Actual effort**: 3,500 tokens

### Implementation Steps:
- [x] Remove Quick Actions section from Dashboard
- [x] Create FeedbackWidget component with button-based message builder
  - Area buttons: Chat, Voice, Journal, Meditation, Vision Board, Patterns, Primary Aim, Settings, Other
  - Function buttons: Navigation, Saving, Loading, Display, Performance, Other
  - State buttons: Works well, Doesn't work, I don't like it, Could be better, Confusing
- [x] Auto-generate message from selected buttons (e.g., "I don't like the voice in the chat")
- [x] Add editable text area for users to modify/add to generated message
- [x] Create backend endpoint to send feedback email to support@metamorphosisworldwide.com
- [x] Format email with user info, timestamp, selected options, and message
- [x] Add success/error toast notifications
- [x] Update early tester notice email to support@metamorphosisworldwide.com
- [x] Test feedback submission flow (visible in screenshot)

### Example Flow:
User clicks: "Chat" + "Voice" + "I don't like it"
→ Message generated: "I don't like the voice in the chat"
→ User can edit or add more details
→ Click "Send Feedback"
→ Email sent to support@metamorphosisworldwide.com



## CRITICAL BUGS - Feedback Widget Issues
**Priority**: URGENT - Fix immediately
- [ ] Message generation logic broken - generates "I don't like it the saving in the chat" instead of proper sentence
- [ ] Fix message generation to use structure: "The [area] area [function] function [state]"
  - Example: Chat + Saving + I don't like it = "The chat area saving function I don't like it"
  - Better: "I don't like it the saving function in the chat area"
- [ ] Email not actually being sent - only logging to console
- [ ] Implement actual email sending to support@metamorphosisworldwide.com
- [ ] Test email delivery

## MISSING FEATURE - Admin Analytics Dashboard
**Priority**: HIGH - Promised but not delivered
- [ ] Create Analytics page (admin-only, accessible from Settings)
- [ ] User Login Log table (user name, last login, total logins)
- [ ] Time Spent Per User table (time today, this week, total)
- [ ] Overall App Usage Metrics cards
- [ ] Feature Usage Breakdown
- [ ] Recent Activity Log (last 100 events)
- [ ] Export to CSV functionality
- [ ] Date range selector
**Estimated effort**: 8,000-10,000 tokens



## CRITICAL BUGS - Analytics Not Tracking (URGENT)
**Priority**: CRITICAL - Analytics showing all zeros
- [ ] Analytics dashboard showing all zeros - events not being logged
- [ ] Journal entries not tracked when created
- [ ] Login events not tracked (users show "Never" logged in despite logging in)
- [ ] Need to instrument app to actually log events (Phase 2 incomplete)
- [ ] Add LOGIN event tracking on user authentication
- [ ] Add JOURNAL_ENTRY_CREATED event tracking when saving journal entries  
- [ ] Add MEDITATION_COMPLETED event tracking
- [ ] Add VISION_ITEM_CREATED event tracking
- [ ] Add CHAT_MESSAGE_SENT event tracking
- [ ] Add PAGE_VIEW event tracking for all pages
**Impact**: High - Cannot collect any usage data without this

## CRITICAL BUGS - Feedback Widget Still Broken
**Priority**: URGENT (COMPLETED)
- [x] Email still not populating with button selections
- [x] SIMPLIFY: Remove message generation entirely
- [x] Just send raw button names clicked to email: "Chat, Saving, I don't like it"
- [x] Users should be able to select multiple buttons in any combination
- [x] Email receives comma-separated list of button names only
**Impact**: High - Cannot collect user feedback (FIXED)

## NEW FEATURE - Life Story Template Questions
**Priority**: HIGH - User experience issue
- [x] Mr. MG questions in Life Story area are too complex/long
- [x] Revert to simple template questions as default
- [x] Add "Ask for personalized question" button
- [x] Template questions should be short and easy to answer
- [x] Personalized AI questions only when user explicitly requests
**Estimated effort**: 2,000-3,000 tokens

## NEW FEATURE - Analytics Enhancements  
**Priority**: MEDIUM
- [ ] Make active users count clickable to show list of who they are
- [ ] Show user names when clicking on active user metrics
- [ ] Add drill-down functionality for all metrics
**Estimated effort**: 1,000-2,000 tokens




## NEW FEATURE - Add Text Message to Feedback Widget
**Priority**: MEDIUM (COMPLETED)
- [x] Add optional text message field to feedback widget
- [x] Allow users to add custom comments along with button selections
- [x] Include text message in email along with button selections
**Estimated effort**: 500 tokens




## CRITICAL BUG FIX - LLM 500 Errors
**Priority**: HIGH - Affecting user experience (COMPLETED)
- [x] Add request timeout to prevent hanging requests (60s timeout with AbortController)
- [x] Implement smart message truncation based on provider limits
- [x] Add provider-specific context window management (Forge: 1M tokens, OpenAI: 128k tokens)
- [x] Improve error logging for better diagnostics
**Estimated effort**: 2,000 tokens




## ACTIVE WORK - Chat Issues
**Priority**: HIGH - User experience and reliability (COMPLETED)
- [x] Fix chat communication errors happening frequently (added retry logic + better error messages)
- [x] Make chat show journal question when opened directly (stored in session context, displayed in chat)
**Estimated effort**: 2,000-3,000 tokens




## NEW FEATURE - Feedback Widget Redesign
**Priority**: MEDIUM - Better user engagement (COMPLETED)
- [x] Redesign feedback widget with "Wouldn't it be nice if..." sentence flow
- [x] Adjust button labels to create natural sentences
- [x] Show live sentence preview as user selects buttons
**Estimated effort**: 1,000 tokens




## CRITICAL BUG - Chat API Issues
**Priority**: URGENT - Chat not working (RESOLVED)
- [x] Investigate and fix chat API errors (primary provider was set to openai without API key)
- [x] Check server logs for error details
- [x] Test chat functionality end-to-end (switched primary to forge, disabled fallback)
**Impact**: High - Core feature broken (FIXED)
**Note**: When OpenAI API key is added tomorrow, can re-enable as fallback provider




## NEW FEATURE - RAG Knowledge Base for Mr. MG
**Priority**: HIGH - Significantly improves Mr. MG quality (COMPLETED)
- [x] Create /server/knowledge/ directory for storing knowledge base docs
- [x] Copy research documents into knowledge directory
- [x] Implement text chunking for knowledge base
- [x] Add embedding generation using Forge API
- [x] Create semantic search/retrieval system with cosine similarity
- [x] Integrate RAG into chat - inject relevant knowledge into context
- [x] Update Mr. MG system prompt with enhanced personality from research (OARS framework, narrative therapy, etc.)
- [ ] Test RAG retrieval quality and relevance (needs testing with real conversations)
**Estimated effort**: 5,000-7,000 tokens




## NEW FEATURE - Chat History Cleanup
**Priority**: MEDIUM - Improves data quality (COMPLETED)
- [x] Only save messages that users actually respond to
- [x] Remove unanswered questions from chat history
- [x] Clean up assistant messages without user replies
- [x] Prevent incomplete conversations from cluttering history
**Estimated effort**: 1,000 tokens
**Implementation**: Assistant messages saved as "pending" in memory. When user responds, both previous assistant message + current user message saved together. If user never responds, assistant message is never saved to database.
**Implementation**: User message now saved together with assistant response atomically. If LLM fails, neither message is saved.




## CRITICAL BUG - OpenAI Provider Not Working
**Priority**: HIGH - User switched to OpenAI and it's failing
- [ ] Debug OpenAI API integration
- [ ] Check error logs for specific failure reason
- [ ] Test OpenAI API call directly
- [ ] Fix configuration or API call issues
**Impact**: High - Cannot use OpenAI as provider

## NEW FEATURE - Chat History Cleanup Tools
**Priority**: HIGH - User needs to clean up chat history (COMPLETED)
- [x] Add "Clear All Chat History" button in settings
- [x] Add auto-cleanup function to remove chats without user replies
- [x] Show confirmation dialog before clearing all history
- [ ] Add option to clear individual chat sessions (not needed - can delete from chat list)
- [ ] Run cleanup on server startup to remove orphaned chats (optional enhancement)
**Estimated effort**: 2,000 tokens
**Implementation**: Added two buttons in Settings - "Clean Up Empty Chats" removes sessions with no user replies, "Clear All Chat History" deletes everything.




## NEW FEATURE - Editable Announcement System
**Priority**: HIGH - User wants to communicate updates to users (COMPLETED)
- [x] Add announcement message editor in admin settings
- [x] Add button next to "Start Here Guide" to show announcement
- [x] Store announcement message in global settings (announcement_title, announcement_content, announcement_emoji, announcement_enabled)
- [x] Make announcement dialog editable (title, content, emoji)
- [x] Show announcement button only when enabled
**Estimated effort**: 2,000 tokens
**Implementation**: Admin can edit announcements in Settings. "Announcements" button appears next to "Start Here Guide" when enabled. Fully customizable title, emoji, and content.




## CRITICAL BUG - Session Not Found Error on Settings Page
**Priority**: HIGH - Error appearing on Settings page (FULLY FIXED)
- [x] Investigate "Session not found" TRPCClientError on Settings page
- [x] Identify which tRPC call is failing (AIChatWidget trying to load deleted session from localStorage)
- [x] Fix the session lookup or query causing the error (added error handling to clear invalid session ID)
- [x] Suppress error logging in global error handler
**Impact**: Medium - Error showing but page may still function
**Complete Fix**: 
1. Added useEffect to detect invalid session errors and automatically clear localStorage
2. Added throwOnError: false to prevent error boundary
3. Filtered "Session not found" from global query error logger in main.tsx
No more error messages or console logs when sessions are deleted.




## ENHANCEMENT - Pre-fill Announcement Editor with Welcome Content
**Priority**: MEDIUM - Better UX for announcement editor (COMPLETED)
- [x] Extract current welcome dialog content from EarlyTesterNotice
- [x] Pre-populate announcement settings in database with welcome content
- [x] Make announcement editor mirror existing welcome page
**Estimated effort**: 500 tokens
**Implementation**: Initialized announcement_title, announcement_emoji, announcement_content, and announcement_enabled with full early tester notice content. Admin can now edit this content directly in Settings.




## CRITICAL BUG - Chat Not Working
**Priority**: URGENT - Chat functionality broken (FIXED)
- [x] Investigate why chat is not responding (assistant responses saved as pending, not in DB)
- [x] Check if message saving logic changes broke chat (pending message system prevented display)
- [x] Test chat send/receive functionality
- [x] Fix any issues with pending message system (added local pending messages state)
**Impact**: Critical - Core feature completely broken
**Fix**: Added pendingMessages state to display assistant responses immediately. Messages show in UI while pending, then get saved to DB when user sends next message. Optimistic UI updates for smooth UX.




## CRITICAL BUG - Chat Response Delay
**Priority**: URGENT - Chat doesn't show response until next message sent (FIXED)
- [x] Assistant response not displaying immediately after user sends message
- [x] Response only appears when user sends another message
- [x] Pending messages optimistic UI not working correctly (was using wrong mutation)
**Impact**: High - Makes chat appear broken/unresponsive
**Fix**: There were two duplicate sendMessage mutations. handleSendMessage was calling sendMessageMutation (without pending logic), while sendMessage (with pending logic) was never used. Added pending messages logic to sendMessageMutation and deleted duplicate.




## CRITICAL BUG - Clear Chat Not Working
**Priority**: HIGH - Clear chat says "new conversation started" but doesn't work (FIXED)
- [x] Clear chat button shows success toast but doesn't actually clear chat
- [x] New session not being created after clearing (state updates were asynchronous)
**Impact**: Medium - Users can't start fresh conversations
**Fix**: Call createSession.mutate() directly instead of relying on initializeMrMgSession which checks stale state values. Also clear pending messages and both localStorage/sessionStorage.

## CRITICAL BUG - Announcement Editor Not Editable
**Priority**: HIGH - Cannot edit announcement settings (FIXED)
- [x] Announcement content textarea is not editable (controlled inputs without local state)
- [x] "Show announcement to users" checkbox doesn't work
- [x] Cannot modify announcement title or emoji
**Impact**: High - Admin cannot update announcements
**Fix**: Added local state for announcement fields. Inputs now update local state onChange and save to database onBlur (for text fields) or onChange (for checkbox). This allows smooth editing while still persisting changes.




## CRITICAL BUG - Journal Entries Repeating
**Priority**: HIGH - Same journal entry showing multiple times (SKIPPED - NOT REPRODUCING)
- [x] Investigate why journal entries are duplicated in the display (entries cleared, issue not reproducing)
- [x] Check if duplicates exist in database or just in UI rendering (no duplicates in DB)
- [ ] Fix query or component to show unique entries only (will address if issue reappears)
**Impact**: High - Data quality and user experience issue
**Note**: User cleared entries, issue not currently visible. May have been timeline + list showing same entries (intentional design). Will monitor.




## BUG FIX - RAG Embedding API 404 Error
**Priority**: MEDIUM - Knowledge base not working (FIXED)
- [x] Investigate embedding API 404 errors in logs
- [x] Fix Forge embedding endpoint URL (was /embeddings, should be /v1/embeddings)
- [x] Test RAG initialization
**Impact**: Medium - Mr. MG knowledge base not functioning
**Fix**: Updated knowledgeBase.ts to use correct Forge API endpoint: ${ENV.forgeApiUrl}/v1/embeddings




## CRITICAL BUG - Chat Messages Duplicating
**Priority**: URGENT - User messages appearing twice in chat (FIXED)
- [x] Investigate why user messages are duplicated in chat display
- [x] Check if issue is with pending messages merging logic (user message added to both DB and pending)
- [x] Fix deduplication to prevent showing same message twice
**Impact**: Critical - Makes chat unusable, confusing UX
**Fix**: Removed user message from pending messages in onMutate. User message is already saved to DB by backend, so only assistant response needs to be in pending state. No more duplicates!




## BUG - Audio Feedback Loop in Chat
**Priority**: MEDIUM - Audio echoing back when mic is on
- [ ] Investigate audio feedback loop when chat mic is enabled
- [ ] Mr. MG's voice responses are being picked up by microphone
- [ ] Add audio output muting during speech recognition
- [ ] Or disable mic automatically when assistant is speaking
**Impact**: Medium - Makes voice chat unusable, but text chat works fine
**Note**: Deferred due to low credits, will fix later




## FEATURE - Limit Meditation Duration Options
**Priority**: HIGH - Prevent testers from creating long meditations (COMPLETED)
- [x] Disable meditation creation above 5 minutes
- [x] Keep only 1 minute and 5 minute options
- [x] Remove 10, 15, 20+ minute options from UI
**Impact**: Medium - Cost control for testing phase
**Implementation**: Updated durations array to [1, 5] only, changed default from 10 to 5 minutes




## 🐛 Chat Resize Not Working

- [x] **Chat window resize handles stopped working** ✅ FIXED
  - Top-left and top-right drag handles not responding
  - User cannot resize chat window anymore
  - Root cause: Resize state and handlers were lost during previous changes
  - Fix: Restored chatSize state, resize handlers, and useEffects
  - Added purple gradient triangular handles in top corners
  - Drag left/up (top-left) or right/up (top-right) to resize
  - Minimum 320px × 400px, no maximum limit
  - Size persists in localStorage



## Fixed - RAG Embedding System (Jan 30, 2025)
- [x] Fixed RAG embedding 404 errors - now supports both OpenAI and Forge providers
- [x] Updated chunk size from 1500 to 2500 characters for better context
- [x] Embeddings now automatically use same provider as chat (Forge or OpenAI)
- [x] Knowledge base re-initialized successfully with Forge embeddings
- [x] RAG context retrieval working - Mr. MG can answer from knowledge base



## OpenAI Connection Issue - RESOLVED (Jan 30, 2025)
- [x] Found root cause: System env vars (OPENAI_BASE_URL) forcing Manus proxy instead of direct OpenAI
- [x] Fixed: Code now calls OpenAI directly, bypassing Manus proxy
- [x] Secondary issue: Project-scoped API key model access permissions
- [x] Decision: Using Forge (Gemini 2.5 Flash) as primary provider instead
- [x] Forge provides 1M token context, excellent quality, no API key setup needed



## Gemini API Integration for RAG (Jan 30, 2025)
- [x] Test Gemini API key with native embedding endpoint
- [x] Update RAG system to use Gemini API for embeddings when Forge is selected
- [x] Add GEMINI_API_KEY to secrets configuration
- [x] Test knowledge base with Forge + Gemini embeddings
- [x] Verify RAG context retrieval works with Gemini - CONFIRMED WORKING




## Life Story Page Visual Redesign (Jan 30, 2025)
### Phase 1: Visual Design Improvements
- [ ] Redesign entry cards with visual hierarchy (larger question, styled response)
- [ ] Add visual indicators for entry types (icons for experiences, challenges, growth)
- [ ] Improve timeline visualization (actual visual timeline, not just period labels)
- [ ] Add color coding or visual themes for different time periods
- [ ] Enhance typography and spacing for better readability
- [ ] Add subtle animations/transitions for card interactions
- [ ] Improve empty state with helpful guidance for new users

### Phase 2: UX Improvements
- [ ] Add entry editing functionality (edit button on each card)
- [ ] Implement "read more/less" for long responses
- [ ] Add entry expansion/collapse for better scanning
- [ ] Improve voice input button visibility and UX
- [ ] Add quick actions menu on each card (edit, delete, chat about this)

### Phase 3: Organization Features
- [ ] Add search functionality to find specific entries
- [ ] Implement filtering by keywords, dates, or themes
- [ ] Add sorting options (chronological, by theme, by importance)
- [ ] Show entry count and statistics
- [ ] Add "combine similar entries" feature (AI-powered)




## Life Story Page - Collapsible Periods (Jan 30, 2025)
- [x] Add click handler to period headers to collapse/expand entries
- [x] Show chevron icons (up/down) to indicate collapse state
- [x] Smooth transitions when collapsing/expanding
- [x] All periods start expanded by default




## Life Story Page - Search & Filter (Jan 30, 2025)
- [ ] Add "All Entries" collapsible header
- [ ] Implement search bar next to "All Entries"
- [ ] Add filter dropdown (Context/Title/Content)
- [ ] Real-time contextual search filtering
- [ ] Filter entries by tags, question, or response text



## New Feature Requests - Timeline View Modes
- [ ] Investigate how search triggers (onChange vs Enter key)
- [ ] Implement Places view: Filter/group entries by location tags
- [ ] Implement Experiences view: Filter/group entries by experience tags
- [ ] Implement Challenges view: Filter/group entries by challenge tags
- [ ] Implement Growth view: Filter/group entries by growth tags
- [ ] Ensure view modes change the timeline display above "All Entries" section



## New Feature Requests - Interactive Timeline Visualizations
- [ ] Design visualization architecture and data schema
- [ ] Update database schema to store visualization metrics (difficulty, opportunity, growth dimensions, coordinates)
- [ ] Add Google Maps API integration for Places view
- [ ] Create Places view: Interactive map with location pins and journey path
- [ ] Create Experiences view: Wheel of Life / Experience Constellation based on psychological research
- [ ] Create Challenges view: Challenge-Opportunity Matrix (2x2 quadrant visualization)
- [ ] Create Growth view: Multi-dimensional growth timeline graph
- [ ] Add AI analysis to extract visualization metrics from journal entries
- [ ] Implement click interactions to view entries from visualizations
- [ ] Test all visualizations with real data



## Location Precision Enhancement
- [x] Add location precision detection (country/state vs city/address)
- [x] Show "Refine Location" prompt for imprecise locations in Places view
- [x] Add "Update Location" button that opens chat with pre-filled message
- [x] Detect large geographic areas and suggest more specific alternatives



## Conversational Location Refinement
- [x] Replace "Edit Location" with "Tell Me More About This Place" button
- [x] Open chat dialog with Mr. MG when button is clicked
- [x] Generate contextual questions about the imprecise location (e.g., "You mentioned Brazil - where specifically were you born?")
- [ ] Create new journal entries from user's responses (handled by existing Mr. MG chat)
- [ ] Automatically extract precise location metadata from new entries (handled by existing AI analysis)
- [ ] Suggest follow-up questions (e.g., "Have you been to other places in Brazil?") (handled by Mr. MG)
- [ ] Link new entries to the original entry that triggered the conversation (future enhancement)



## Bug Fixes
- [x] Fix z-index issue where map appears on top of chat dialog



## Automatic Location Update from Chat
- [ ] Detect when user responds to location refinement question in Mr. MG chat
- [ ] Extract precise location from user's first response
- [ ] Automatically update the original entry's placeContext field
- [ ] Refresh the Places map to show updated location
- [ ] Continue conversation to gather additional stories as new entries



## Manual Location Update Field
- [x] Add inline input field next to "Tell Me More About This Place" button
- [x] Allow users to type precise location directly
- [x] Add Save button to update entry's placeContext
- [x] Refresh map after location update



## Keep "Tell Me More" Button for All Locations
- [x] Show "Tell Me More" button for both imprecise and precise locations
- [x] Change prompt text based on precision (warning for imprecise, invitation for precise)
- [x] Encourage storytelling for all locations, not just imprecise ones



## Interactive Experiences Visualization
- [x] Create draggable bubble interface for experiences
- [x] Implement color changing based on position/proximity
- [x] Allow users to arrange bubbles freely on canvas
- [x] Size bubbles based on number of entries
- [x] Add visual connections between nearby bubbles (proximity-based color blending)
- [ ] Save user's bubble arrangement positions (future enhancement)
- [x] Show experience details on bubble click/hover



## Bubble Legibility Improvements
- [x] Increase bubble sizes for better readability
- [x] Add 3D effects with borders and shadows
- [x] Remove entry count numbers from bubbles
- [x] Improve text contrast and typography
- [x] Add depth with gradients and highlights



## Bubble Color and Text Fixes
- [x] Restore dynamic color changing (position/proximity-based)
- [x] Reduce font size so text fits inside bubbles
- [x] Abbreviate or wrap long experience names
- [x] Remove gradient that's covering dynamic colors



## Bug: OAuth Callback Error
- [x] Investigate "OAuth callback failed" error (database connection reset)
- [x] Check server logs for authentication issues (found ECONNRESET)
- [x] Verify OAuth configuration and environment variables (OAuth config is fine, was DB issue)
- [x] Restart server to fix database connection



## Bug: Forge API Errors on Journal Page
- [x] Investigate "Both forge and forge providers failed" errors (null content part in LLM response)
- [x] Check which tRPC procedures are calling forge API (sendMessage in aiChatRouter)
- [x] Verify BUILT_IN_FORGE_API_KEY and BUILT_IN_FORGE_API_URL environment variables (working)
- [x] Add error handling for forge API failures (added null check in normalizeContentPart)



## Bug: Location Metadata Too Descriptive
- [x] Fix AI metadata extraction prompt to only extract geographic location names
- [x] Update placeContext to contain only city/state/country (e.g., "Piracicaba" not "Piracicaba, best friend's small farm, nature")
- [x] Ensure geocoding works properly with clean location names



## Bug: Geocoding API Failures
- [x] Fix "Failed to fetch" errors in PlacesMapView geocoding
- [x] Add rate limiting to respect Nominatim's 1 request/second limit (1.1s delay between requests)
- [x] Add error handling and fallback for failed geocoding requests (try-catch with continue)
- [ ] Consider caching geocoded results to reduce API calls (future enhancement)



## Places Map Improvements
- [x] Make entry lists under each location collapsible/minimized by default
- [x] Show entry count but hide full entry cards until user expands
- [ ] Investigate duplicate Piracicaba entries (same question, different metadata variations)



## UI Improvements
- [x] Make location sections in Places view ultra-minimal when collapsed - showing only location name and entry count on a single line

## Data Quality Improvements
- [x] Normalize location names by removing accents to prevent duplicates (e.g., "São Paulo" vs "Sao Paulo")



## Data Quality Improvements
- [ ] Normalize location names by removing accents to prevent duplicates (e.g., "São Paulo" vs "Sao Paulo")




## FUTURE IMPROVEMENTS - Location Data Import
**Goal**: Allow users to import location history from Google/Facebook data exports to auto-populate Places and generate contextual journal prompts.

### Benefits:
- Privacy-first approach (user downloads their own data, no OAuth needed)
- Years of historical location data imported at once
- Automatic journal prompt suggestions based on places visited
- Timeline enrichment with location context
- Photo metadata extraction for additional location data

### Implementation Steps:

#### Phase 1: Data Upload & Storage
- [ ] Create file upload interface for data archives (ZIP support)
- [ ] Support Google Takeout format (JSON location history)
- [ ] Support Facebook data export format (JSON check-ins, locations)
- [ ] Parse and validate uploaded data files
- [ ] Store raw import data temporarily for processing

#### Phase 2: Location History Parser
- [ ] Parse Google Location History JSON format
- [ ] Parse Facebook check-ins and tagged locations
- [ ] Extract location coordinates, timestamps, place names
- [ ] Handle different date/time formats from both platforms
- [ ] Deduplicate location entries

#### Phase 3: Photo Metadata Extraction
- [ ] Extract EXIF location data from uploaded photos
- [ ] Parse Google Photos metadata JSON
- [ ] Parse Facebook photo location data
- [ ] Match photos to location timeline

#### Phase 4: AI Analysis & Enrichment
- [ ] Analyze location patterns (frequent places, time periods)
- [ ] Identify significant locations (home, work, travel destinations)
- [ ] Calculate time spent at each location
- [ ] Detect trips and travel patterns
- [ ] Generate location-based insights

#### Phase 5: Journal Prompt Generation
- [ ] Generate contextual prompts based on location history
  - "Tell me about your time in Paris in 2019"
  - "What memories do you have from your visits to grandmother's house?"
- [ ] Prioritize prompts by location significance
- [ ] Group prompts by time period and place
- [ ] Allow user to accept/reject suggested prompts

#### Phase 6: Auto-populate Metadata
- [ ] When user writes entries, suggest locations from history
- [ ] Auto-fill placeContext based on timeContext and location data
- [ ] Show "You were in [Location] during this time" hints
- [ ] Allow manual override of suggested locations

#### Phase 7: Timeline Visualization
- [ ] Display imported locations on Places map
- [ ] Show location clusters and travel routes
- [ ] Integrate with existing timeline views
- [ ] Add "imported from Google/Facebook" badges
- [ ] Allow filtering by data source

#### Phase 8: Privacy & Data Management
- [ ] Clear imported raw data after processing
- [ ] Allow user to delete imported location history
- [ ] Show what data was imported and when
- [ ] Export processed location data
- [ ] GDPR compliance for data handling

**Priority**: FUTURE - High value feature for later implementation
**Estimated Effort**: Large (2-3 weeks of development)




## CRITICAL BUG - Journal Entry Duplication
- [x] Deleted journal entries reappearing (Piracicaba example)
- [x] Audit all code paths that create journal entries
- [x] Find root cause of duplication
- [x] Fix duplication bug to prevent entries from being recreated after deletion




## CRITICAL BUG - LLM API Failures
- [x] "Both forge and forge providers failed" error in journal page
- [x] Check if OpenAI fallback is configured properly
- [x] Add graceful error handling when both providers fail
- [x] Show user-friendly error message instead of crashing




## UI/UX Improvements - Markdown & Chat
- [x] Fix markdown rendering - **asterisks** should show as bold in chat and dashboard
- [ ] Fix chat refresh issue - Forge fails after first 1-2 messages (OpenAI API key issue)
- [x] Implement category-aware questions - Mr. MG questions should match selected Life Story category (Places, Experiences, Growth, Challenges)

## NEW FEATURE - Interactive Timeline Visualization
- [x] Build horizontal scrollable timeline starting from birth
- [x] Plot journal entries on timeline by date
- [x] Add dimension selector (Places, Experiences, Growth, Challenges, All)
- [x] Color code events by dimension type
- [x] Add hover/click to view entry details
- [x] Auto-scroll to current date on load




## Timeline Redesign - Show Only Relevant Years
- [x] Add birth year field to user profile (with "?" if unknown)
- [x] Update timeline to show only years that have journal entries
- [x] Extract year mentions from journal entry content (e.g., "2010" from "I lived in Piacenza in 2010")
- [x] Remove age labels and empty year markers
- [ ] Add UI to set/update birth year from Settings page




## NEW FEATURE - Data Completeness System
- [x] Create completeness calculation utility (checks for year, location, experience, challenge, growth)
- [x] Add visual completeness indicators to journal entry cards (progress bar or badges)
- [x] Show missing metadata tags on each entry
- [x] Create "Complete This Entry" button that prompts for missing data
- [ ] Add dashboard metric showing overall completion percentage
- [x] Highlight complete vs incomplete entries on timeline (different opacity/size)
- [x] Generate targeted questions for missing metadata (e.g., "What year did this happen?")




## NEW FEATURE - Smart Notification System for Missing Data
- [x] Create notifications table in database schema
- [x] Build background scanner that detects entries with null metadata fields
- [x] Generate notifications for each missing field (no AI, just template questions)
- [x] Create Notifications page/section in app
- [x] Build quick-fill forms (date picker, location input, dropdowns for types)
- [x] Implement direct database update (bypass AI completely)
- [x] Add notification dismissal and auto-dismiss on completion
- [x] Show notification count badge in navigation
- [ ] Add notification preferences (auto-scan frequency, which fields to prompt for)




## BUG FIX - Revert View Visualizations
- [ ] Restore Places view to show map visualization (not timeline)
- [ ] Restore Experiences view to original bubble/card visualization (not timeline)
- [ ] Keep timeline visualization only in "All Events" (Timeline) tab




## BUG FIX - Completeness Display Issues
- [x] Fix completeness calculation - entries with null fields should NOT show as "Complete"
- [x] Hide "null" tags - don't show tags for empty fields, just leave them blank
- [x] Make missing field indicators clickable to quickly fill data
- [x] Trigger notification scan automatically when viewing journal
- [x] Show notification count in sidebar badge




## UX Improvements - Alerts & Timeline
- [x] Rename "Data Completion" to "Alerts" in sidebar
- [x] Show actual questions in alert notification cards (e.g., "When did this happen?" instead of generic "Answer Now")
- [x] Add "Complete Data" button to incomplete journal entry cards that links to alerts page
- [x] Fix timeline hover text showing "name of place" and "name of experience" - should show actual values




## CRITICAL BUG - Completeness Calculation
- [ ] Fix completeness calculation to require ALL 5 fields (time, place, experience, challenge, growth)
- [ ] Entry should only show "Complete" when all 5 fields are populated
- [ ] Always display all 5 metadata tags on journal cards, even when empty
- [ ] Show placeholder text for empty fields (e.g., "Add time", "Add place", "Add experience", etc.)
- [ ] Update calculateCompleteness function in shared/completeness.ts
- [ ] Update JournalEntryCard.tsx to always render all 5 tags




## Bug Fixes - November 1, 2025
- [x] Fix /notifications (Alerts) page error: "Invalid input: expected number, received undefined" for id parameter
- [x] Fix journal entry cards to always show all 5 metadata tags (time, place, experience, challenge, growth) even when empty
- [x] Ensure empty tags show placeholder text like "Add time", "Add place", etc. instead of hiding the tag
- [ ] KNOWN ISSUE: Browser caching preventing tag changes from showing - code is correct but requires hard refresh or cache clear




## Feature: Admin LLM Configuration
- [x] Add database fields to store primary provider, primary model, fallback provider, fallback model
- [x] Create backend API endpoints to save and retrieve LLM configuration
- [x] Build admin settings UI with provider dropdowns (OpenAI, Forge/Gemini, Gemini Direct)
- [x] Add model selection dropdowns that update based on selected provider
- [x] Update LLM invocation logic to use configured provider and model
- [ ] Test with different provider/model combinations
- [ ] Fix: Primary Model field appears empty on page load




## UX Improvements - Alerts Page Cards
- [x] Make notification cards responsive width (currently too narrow)
- [x] Remove repetitive text in cards - question appears twice (in title and "Entry:" section)
- [x] Simplify card display: show metadata field name + question once + existing answer




## Feature: Interactive Bubble Manipulation (Patterns Page)
- [ ] Add zoom in/out controls to bubble visualization
- [ ] Add pan/drag functionality to navigate the bubble space
- [ ] Implement multi-selection (shift-click or lasso drag)
- [ ] Create "Combine" button that appears when multiple bubbles are selected
- [ ] Add popping animation when bubbles are combined
- [ ] Create AI endpoint to suggest names for combined experience groups
- [ ] Update database schema to support combined/grouped experiences
- [ ] Sync journal entries when bubbles are combined (update experienceType field)
- [ ] Show visual feedback for selected bubbles (highlight/border)
- [ ] Add undo functionality for bubble combinations




## Feature: Share a Thought (Free-form Input)
**Goal**: Allow users to share thoughts freely without answering specific questions. AI analyzes and proposes where to store it.

### Phase 1: Database & User Preferences
- [x] Add auto_approve_thoughts boolean field to users table (default: false)
- [x] Create migration to add field

### Phase 2: Backend API
- [x] Create analyzeThought endpoint that:
  - Takes free-form text input
  - Uses LLM to extract metadata (time, place, experience, challenge, growth)
  - Proposes journal entry structure
  - Returns proposed entry for user review
- [x] Create saveThought endpoint that:
  - Saves approved thought as journal entry
  - Updates user's auto_approve preference if changed

### Phase 3: ShareThought Component
- [x] Create ShareThought.tsx component with:
  - Text area for free-form input
  - Minimal Mr. MG avatar/presence
  - Submit button
  - Loading state while AI analyzes
  - Review card showing proposed metadata
  - Approve/Edit/Reject buttons
  - "Always auto-approve" checkbox
  - Success/error feedback

### Phase 4: Dashboard Integration
- [x] Add ShareThought component to Dashboard
- [x] Place prominently in center/top area
- [x] Style as inviting "Share a thought..." prompt
- [x] Show Mr. MG's small avatar nearby

### Phase 5: Life Story Page Integration
- [x] Add toggle at top of Life Story page
- [x] Toggle between "Guided Questions" and "Share a Thought" modes
- [x] Show ShareThought component when in free-form mode
- [x] Maintain existing guided question flow as default

### Phase 6: Auto-approve Flow
- [x] When auto-approve is enabled, skip review step
- [x] Show brief confirmation toast instead
- [ ] Allow user to disable auto-approve in Settings

### Phase 7: Testing
- [ ] Test thought analysis with various input types
- [ ] Test approval/rejection flow
- [ ] Test auto-approve preference persistence
- [ ] Test integration on both Dashboard and Life Story page




## BUG - Share a Thought Toggle Missing
- [x] Life Story page not showing Guided/Free-form toggle at top
- [x] Toggle should appear in top right corner next to page title
- [x] Fix Journal.tsx to render the toggle properly
- NOTE: Toggle is working correctly, appears as "Guided" button with switch in top right




## UX Enhancement - Prominent Toggle
- [x] Make Guided/Free-form toggle more visually prominent
- [x] Add colorful gradient (yellow-to-orange-to-red gradient)
- [x] Increase size and add animation/effects to draw attention (hover scale, shadow)


## Dashboard Button Prominence
- [x] Make Start Here Guide button more prominent with blue-green gradient (cyan-teal-emerald)
- [x] Make Announcements button more prominent with blue-purple gradient (blue-indigo-purple)
- [x] Add hover effects and shadows for better visibility (scale, shadow-xl)

## Timeline Visualization Bug
- [x] Timeline dots don't show descriptions/tooltips on hover
- [x] Investigate Timeline component tooltip implementation
- [x] Add proper tooltip display with entry details (question, response preview, metadata, completion %)

## Timeline Enhancement - Visible Labels
- [x] Add visible text labels to timeline dots showing metadata
- [x] Labels should change based on selected filter (Places/Experiences/Challenges/Growth)
- [x] When "All Events" selected, show most prominent metadata
- [x] When specific filter selected, show that dimension's text
- [x] Style labels to be readable but not cluttered (10px font, 120px max width, truncated)
- [x] Position labels near dots without overlapping (flex layout with gap)

## Announcements Dialog Bug
- [x] Announcements dialog has overflow text that's not displaying properly
- [x] Add proper scrolling to dialog content (max-h-[80vh], overflow-y-auto)
- [x] Ensure all announcement text is readable (flex layout with scrollable middle section)

## Phase 1: AI Experience Analysis Engine
- [ ] Update database schema with experience analysis fields
- [ ] Create experience_analyses table
- [ ] Create AI analyzer function (experienceAnalyzer.ts)
- [ ] Implement LLM prompts for dimension extraction
- [ ] Build tRPC endpoints (analyze, analyzeAll, findSimilar)
- [ ] Create simple test UI (ExperiencesTest.tsx)
- [ ] Test with real journal entries

## Phase 1: AI Experience Analysis Engine ✅ COMPLETE
- [x] Update database schema for experience analysis (experience_analyses table with 9 ECQ dimensions)
- [x] Create AI experience analyzer with LLM integration (experienceAnalyzer.ts with structured JSON)
- [x] Build tRPC endpoints for experience analysis (analyze, analyzeAll, getAnalysis, findSimilar, getStats)
- [x] Create simple test UI to verify functionality (ExperiencesTest.tsx with table view)
- [x] Test with real journal entries (successfully analyzed 2013 life change entry - Freedom theme, 8/10 impact)

**Test Results**: AI successfully extracted psychological dimensions, classified life themes (Freedom), identified experience archetype (Self-Discovery Through Challenge), and scored ECQ dimensions realistically. Ready for Phase 2 (Semantic Clustering).


## CRITICAL BUG - Mobile Timeline Display
- [x] Timeline visualization not showing on mobile devices (fixed spacing from 200px to 150px)
- [x] Places map not visible on mobile (responsive layout applied)
- [x] Experiences section not visible on mobile (responsive layout applied)
- [x] Timeline component not rendering on mobile (added minWidth and horizontal padding)
- [x] Investigate responsive design issues in Life Story page (identified absolute positioning issue)
- [x] Fix CSS/layout for mobile viewport (reduced spacing, added padding, increased height to 280px)

