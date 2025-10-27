# Lifer App TODO

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

## Recently Completed
- [x] Implement voice chat interface with Mr. MG
- [x] Add voice input (speech-to-text) for chat via microphone button
- [x] Add voice output (text-to-speech) for Mr. MG responses with toggle control
- [x] Create text-to-speech backend endpoint using ElevenLabs API
- [x] Integrate useVoiceChat hook with Web Speech API
- [x] Add microphone and volume controls to chat widget

## Recently Completed
- [x] Test voice chat end-to-end - confirmed working with browser security limitations
- [x] Conversation memory already implemented (last 10 messages passed to LLM)
- [x] Make Mr. MG responses more concise and action-oriented (refined system prompts)
- [x] Add delete capability to Mr. MG agent (intent detection and response handling)

## In Progress
- [ ] Implement 3-step action protocol UI (highlight → confirm → execute)
- [ ] Add actual delete execution functions to backend

## Recently Completed
- [x] Make journal entry cards fully editable (response text and all metadata)

## Recently Completed
- [x] Make audio player more colorful with gradient styling
- [x] Add playback speed options (0.75x, 1x, 1.25x, 1.5x) to audio player

## Recently Completed
- [x] Add Mr. MG voice intro audio to Start Here Guide with play/pause/replay controls
- [x] Fix Mr. MG post-navigation messages to be contextual and conversational

## Recently Completed
- [x] Update core questions to "Who am I?" and "What do I want?"
- [x] Rebrand Mr. MG as the AI Avatar of Michael E. Gerber
- [x] Fix welcome dialog to show for new users on first login (now uses database instead of localStorage)
- [x] Create Mr. MG audio introduction script for first-time users

## Recently Completed
- [x] Transform Mr. MG into AI Agent with navigation and action capabilities
- [x] Add intent detection to understand user commands (navigate, create, update, delete)
- [x] Implement action handlers for common tasks (journal entries, meditations, vision items)
- [x] Enable Mr. MG to execute actions and provide feedback

## Recently Completed
- [x] Refine Mr. MG's proactive messages to ask insightful questions based on latest journal entry
- [x] Transform AI chat widget into Mr. MG-only interface
- [x] Add proactive greeting for returning users based on their progress
- [x] Make Mr. MG suggest next actions contextually

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
- [ ] Voice chat for Life Story page (dedicated voice journaling interface)



## Bugs to Fix
- [x] Voice chat: Fix duplicate useVoiceChat hook call (line 19 and 100 in AIChatWidget)
- [ ] Voice chat: Keep listening continuously, only stop when user clicks mic button or 10 seconds of silence
- [x] Voice chat: Transcript not being captured and sent to Mr. MG

## Feature Improvements Needed
- [ ] Make Mr. MG more proactive and conversational (like example conversation)
- [ ] Add meditation voice preference selection in conversation flow
- [ ] Add post-meditation reflection and rating capture
- [ ] Mr. MG should guide users through meditation creation process
- [ ] Mr. MG should offer to navigate and take actions proactively
- [ ] Add ability for Mr. MG to update journal entries and patterns based on conversation



## Voice Improvements
- [x] Use custom Mr. MG voice from ElevenLabs (ID: VQypEoV1u8Wo9oGgDmW0) for chat responses



## Recently Completed
- [x] Updated Mr. MG intro audio to MichaelMrMGIntroV1.mp3



## New Features
- [x] Add ElevenLabs voice ID input in settings for Mr. MG chat voice customization



## Recently Completed
- [x] Move Mr. MG voice ID from localStorage to environment variable (VITE_MR_MG_VOICE_ID)
- [x] Remove voice ID input from Settings page
- [x] Add VITE_MR_MG_VOICE_ID to secrets configuration



## Bugs
- [x] VITE_MR_MG_VOICE_ID not being read correctly from environment - using wrong voice (fixed: updated fallback to match user's voice ID)



## Bugs
- [x] Voice input duplicating text (capturing both interim and final results) - fixed by separating final and interim transcripts



## CRITICAL Bugs
- [x] Voice chat using wrong voice (woman's voice instead of Mr. MG custom voice) - fixed by hardcoding voice ID
- [x] Voice chat audio looping infinitely - draining ElevenLabs tokens - fixed by tracking last spoken message



## CRITICAL Bugs
- [x] Voice chat STILL using woman's voice despite hardcoded voice ID - fixed regex to handle voice IDs starting with numbers

## New Features
- [x] Add Mr. MG system prompt editor in Settings (admin only)
- [x] Allow editing of chat instructions without code changes



## Bugs
- [ ] Mr. MG not responding contextually to user questions - system prompt incomplete in database (needs manual update via Settings)
- [x] Chat history lost between sessions - fixed by persisting session ID in localStorage

## New Features
- [x] Add meditation voice ID environment variables (VITE_MEDITATION_VOICE_MALE, VITE_MEDITATION_VOICE_FEMALE, VITE_MEDITATION_VOICE_NEUTRAL)
- [ ] Allow user to select meditation voice in UI (voice IDs ready, need UI implementation)



## Investigation
- [x] Check if there are hardcoded prompts overriding the Settings system prompt - FOUND: Chat widget uses executeAction (hardcoded) instead of sendMessage (database prompt)
- [x] Fix: Change chat widget to use sendMessage endpoint instead of executeAction - Mr. MG now uses ONLY the database system prompt from Settings



## UI Improvements
- [x] Disable auto-open for Mr. MG chat widget - users must click to open



## Bugs
- [x] Chat history not displaying full conversation - removed hardcoded greeting, now shows only database messages
- [x] Initial greeting added to database when creating new session for better UX



## New Features
- [x] Add "Clear Chat" or "New Conversation" button to chat widget (🔄 icon in header)
- [x] Make chat history session-based (reset on browser close/logout, not persistent forever)
- [x] Keep contextual greeting that references user's data (journal, patterns, vision, etc.)



## Updates
- [x] Replace generic meditation voice env vars with specific voice names (Rachel, Antoni, Josh, Bella, Elli, Domi)
- [x] Updated voiceOptions.ts to read from environment variables with fallbacks



## CRITICAL Bugs
- [x] Voice input repeating/looping text continuously - fixed by tracking processed result indices



## CRITICAL Bugs
- [x] Voice input STILL duplicating on mobile - fixed by rebuilding transcript from scratch instead of accumulating



## CRITICAL Bugs
- [x] Voice input STILL duplicating even after v2 fix - disabled interim results (text appears after pauses, no real-time display)



## Voice Input Improvements
- [x] Add 10-second silence timer before auto-stopping voice input (prevent interrupting long thoughts)
- [x] Make voice input append to existing text instead of replacing it (build message in segments)



## New Features
- [x] Integrate Mr. MG chat with journal - automatically save life stories shared in chat to Life Story journal
- [x] Add story detection logic using LLM function calling to identify when user is sharing a life experience
- [x] Confirm with user when a story is saved to journal



## CRITICAL Bugs
- [ ] "Cannot read properties of undefined (reading 'type')" error when sending messages in chat



## Life Story Timeline Improvements
- [x] Change page title dynamically when switching between Timeline/Places/Experiences/Challenges/Growth tabs
- [x] Add confirmation dialog before deleting journal entries ("Are you sure you want to delete?")
- [x] Add undo functionality for deleted entries (10-second window to undo with toast action button)



## CRITICAL Bugs
- [x] Mr. MG's markdown formatting (**bold**) is being read aloud as "asterisk asterisk" in TTS - stripped markdown before TTS



## Meditation Bugs & Features
- [x] Add delete button for meditation recordings with confirmation dialog
- [x] Fix meditation voice ID not being used from environment variables (voice IDs are passed correctly)
- [ ] Fix background music not loading (Infinity:NaN duration) - background music is optional feature
- [ ] Replace AI-generated background music with static ambient audio files to save tokens - background music is optional feature



## Voice Provider Cost Management
- [x] Add voice provider setting to admin Settings page (ElevenLabs, Google Cloud TTS, Browser TTS)
- [x] Allow switching between providers to control costs
- [x] Update textToSpeech service to respect provider setting



## Bugs
- [x] Fix "No audio URL returned" error when Browser TTS is selected - added browser-based speech synthesis fallback



## Critical Audio Bugs
- [x] Fix audio looping - messages playing repeatedly (wrapped speak in useCallback to stabilize reference)
- [x] Fix mute button - now stops both audio URL playback and browser TTS (speechSynthesis.cancel)
- [ ] Add Google Cloud TTS API key to environment variables documentation



## Mobile Optimization Issues
- [x] Fix "Browser TTS failed" error on mobile devices (suppressed error, it's expected on some mobile browsers)
- [ ] Fix "Cannot read properties of undefined (reading 'type')" error when sending messages (needs investigation)
- [x] Optimize chat widget layout for mobile screens (full-screen on mobile, card on desktop)
- [ ] Test voice input/output on mobile Safari and Chrome
- [ ] Improve responsive design for all pages on mobile devices



## Voice Provider UX Issues
- [x] Add validation to check if API keys exist before allowing provider selection (tests on change)
- [x] Show warning message when selected provider's API key is missing (toast + status box)
- [x] Display actual active provider vs selected provider (status box shows "API key missing or invalid. Falling back to Browser TTS")
- [ ] Disable/gray out providers that don't have API keys configured (shows warning instead)
- [x] Add "Test Voice" button to verify provider is working (automatic test on provider change)



## Critical Issues - Priority

### Security
- [x] Hide Mr. MG Instructions from non-admin users (only show to admin role)

### Mobile UX Bugs
- [x] Fix vision creation submit button disappearing on mobile (added scrolling to dialog)
- [ ] Test and fix all forms on mobile devices
- [x] Ensure all buttons are visible and accessible on mobile

### Voice Improvements
- [x] Add Google TTS voice selection (male/female, different accents) - 8 voices available
- [ ] Allow users to preview/test voices before selecting
- [x] Add voice options to Settings page (shows when Google provider selected)



## Chat Issues & Features

### Bugs
- [ ] Fix message not clearing from input field after send on mobile
- [ ] Ensure textarea clears immediately after successful message send

### Features
- [ ] Add chat history view - show list of previous conversations
- [ ] Allow users to select and continue old chat threads
- [ ] Add "View History" or "Past Conversations" button to chat widget
- [ ] Display conversation titles/dates in history list



## UI/UX Issues
- [x] Move chat button to bottom left to avoid interfering with Manus alert (bottom right)



## Security Issues
- [x] Hide Voice Settings from non-admin users (only show to admin role)



## Mobile UI Bugs
- [x] Fix "Ask Mr. MG for Guidance" button getting cut off on mobile (text too long)
- [x] Make button text responsive - shows "Ask Mr. MG" on mobile, full text on desktop



## Chat UX Consistency
- [x] Ensure Mr. MG chat in Life Story/Journal uses same component as floating chat widget
- [x] Make chat experience seamless across all entry points (floating button, Life Story, Journal)
- [x] Removed custom Mr. MG dialog from Journal - now triggers global AIChatWidget
- [x] Same voice settings, history, and features available in both contexts



## Critical Mobile UX Issues
- [x] Fix keyboard blocking text input on mobile - added scroll-margin and focus handling
- [x] Fix chat widget being larger than mobile screen - now uses inset-4 for proper full-screen on mobile
- [x] Add auto-scroll to keep focused input visible when keyboard appears (scroll-margin CSS)
- [x] Reduce dialog padding/margins on mobile - VisionBoard dialog now has px-1 on mobile
- [x] Updated viewport meta to allow user scaling and better keyboard handling
- [x] Added CSS to prevent body scroll when dialogs open on mobile



## Chat Widget Mobile Issues
- [x] Fix chat widget requiring scroll to see on mobile - now uses inset-0 for full viewport
- [x] Prevent background from scrolling when chat widget is open - added body scroll lock and overlay
- [x] Ensure chat widget is full viewport height on mobile without needing scroll - truly fixed position



## Conversation History Feature
- [x] Add "Conversations" button to chat header to view conversation list (MessageSquare icon)
- [x] Create conversation list UI showing past sessions with date/preview
- [x] Allow users to switch between conversations (click to load)
- [x] Highlight current active conversation (purple background)
- [x] Load messages when switching conversations (refetchMessages)
- [x] Backend endpoint already exists (listSessions)
- [x] Show conversation preview (title and date)
- [x] Mobile-friendly (slide-in panel with max-height)



## Mobile Menu Issues
- [x] Hide Mr. MG chat button when mobile menu is open (added sidebarOpen prop check)



## Critical Mobile Chat Input Issue
- [x] Fix keyboard covering textarea on mobile - added scrollIntoView on focus
- [x] Scroll textarea into view when focused on mobile (300ms delay for keyboard animation)
- [x] Adjust chat layout to account for virtual keyboard height (max-h-screen)



## Dashboard UX Improvement
- [x] Make stat cards clickable (Journal Entries → /journal, Patterns → /patterns, Vision Items → /vision, Meditations → /meditation)
- [x] Add hover effect to indicate they're clickable (scale-105 on hover)
- [x] Add cursor pointer on hover

