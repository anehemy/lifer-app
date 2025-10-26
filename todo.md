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

