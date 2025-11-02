# Phase 3 Complete: Experience Combination Logic

**Date:** November 1, 2025  
**Status:** ✅ Implemented & Ready to Test

## Overview

Phase 3 adds the ability to manually combine similar experiences and generate consolidated wisdom insights using exploratory processing (not just feel-good closure).

---

## What Was Built

### 1. Database Schema ✅

**New Tables:**
- `combined_experiences` - Stores consolidated wisdom from combined experiences
  - `id`, `userId`, `name`, `consolidatedWisdom`, `primaryTheme`, `archetypes`, `combinedAt`, `updatedAt`
  
- `experience_combinations` - Junction table linking journal entries to combinations
  - `id`, `combinedExperienceId`, `journalEntryId`, `addedAt`

**Migration:** `drizzle/0019_lethal_blink.sql`

### 2. AI Wisdom Generator ✅

**File:** `server/ai/wisdomGenerator.ts`

**Functions:**
- `generateConsolidatedWisdom()` - Analyzes multiple experiences and extracts:
  - Consolidated wisdom (3-4 sentences focusing on exploration/learning)
  - Primary life theme (Love, Value, Power, Freedom, Truth, Justice)
  - Common archetypes (2-3 recurring patterns)
  - Key insights (3-5 specific learnings)
  
- `suggestCombinationName()` - Creates evocative, meaningful names for combinations

**Approach:** Exploratory processing - focuses on learning, growth, and deeper understanding (not closure or comfort)

### 3. tRPC Endpoints ✅

**File:** `server/experiencesRouter.ts`

**New Endpoints:**
1. `combineExperiences` - Combine 2+ experiences, generate wisdom, save to database
2. `getCombinedExperiences` - Get all user's combined experiences with linked entries
3. `getCombinedExperience` - Get single combination with full details
4. `deleteCombinedExperience` - Delete a combination and its links

### 4. User Interface ✅

**File:** `client/src/pages/ExperiencesTest.tsx`

**Features:**
- **Phase 3 Section** (emerald-themed) appears after Phase 2
- **Selection UI:**
  - Checkboxes on analyzed entries
  - Selection counter and instructions
  - "Combine Selected" button (emerald gradient)
  - "Clear Selection" button
  
- **Combined Wisdoms Display:**
  - Card-based layout
  - Shows name, theme, entry count
  - Displays consolidated wisdom (italic quote)
  - Lists archetypes as badges
  - "Combined" badge indicator

---

## How It Works

### User Flow:

1. **Analyze experiences** (Phase 1) - Extract psychological dimensions
2. **Generate embeddings** (Phase 2) - Create semantic vectors
3. **Find patterns** (Phase 2) - Identify clusters of similar experiences
4. **Select experiences** (Phase 3) - Check 2+ related experiences
5. **Combine** (Phase 3) - AI generates consolidated wisdom
6. **View wisdom** (Phase 3) - See the deeper pattern and insights

### AI Processing:

When combining experiences, the AI:
1. Receives all selected experiences with their analyses
2. Identifies the deeper truth that emerges when viewing them together
3. Determines the primary life theme
4. Extracts common archetypes (recurring patterns)
5. Generates specific insights focusing on:
   - What you're learning about yourself
   - How your understanding has evolved
   - What questions remain open
   - What you're discovering (not what you've resolved)

---

## Testing Instructions

### Prerequisites:
1. Have at least 2 analyzed journal entries
2. Navigate to `/experiences-test`

### Test Steps:

1. **Analyze entries:**
   ```
   Click "Analyze All" to process all journal entries
   ```

2. **Select experiences to combine:**
   ```
   - Scroll to "Journal Entries" section
   - Check the boxes next to 2 or more analyzed entries
   - Look for similar themes or experiences
   ```

3. **Combine:**
   ```
   - Scroll up to Phase 3 section
   - Click "Combine Selected (X)" button
   - Wait for AI to generate wisdom (~5-10 seconds)
   ```

4. **View result:**
   ```
   - See the suggested name
   - Read the consolidated wisdom
   - Check the archetypes
   - Verify the primary theme
   ```

5. **Test multiple combinations:**
   ```
   - Clear selection
   - Select different experiences
   - Combine again
   - Compare wisdoms
   ```

---

## Example Output

**Input:** 3 experiences about relocations (2010 Italy, 2013 Orlando, 2015 Asheville)

**Expected Output:**
```json
{
  "name": "Navigating Geographic Transitions",
  "consolidatedWisdom": "Through multiple relocations across continents and cultures, you've been exploring what 'home' truly means beyond physical location. Each move has revealed different aspects of your identity and values, showing that belonging is less about place and more about alignment with your authentic self. The pattern suggests you're learning to carry your sense of home within you, rather than seeking it externally.",
  "primaryTheme": "Freedom",
  "archetypes": [
    "Geographic Self-Discovery",
    "Cultural Adaptation",
    "Redefining Belonging"
  ],
  "insights": [
    "Each relocation has stripped away another layer of external identity",
    "You're discovering that discomfort is often a sign of growth, not wrongness",
    "The question isn't 'where should I be?' but 'who am I becoming?'",
    "Home is increasingly defined by internal alignment rather than external circumstances"
  ]
}
```

---

## Technical Details

### Database Relationships:
```
users (1) ----< combined_experiences (many)
combined_experiences (1) ----< experience_combinations (many) >---- journalEntries (many)
```

### AI Model:
- Uses `invokeLLM` with structured JSON output
- Enforces strict schema for consistency
- Temperature optimized for wisdom extraction
- System prompt emphasizes exploratory processing

### UI State Management:
- `selectedForCombination` - Array of entry IDs
- `combinedExperiences` - tRPC query result
- `combineMutation` - Handles combination API call
- Optimistic UI updates with loading states

---

## Next Steps (Phase 4)

Phase 4 will add the **bubble visualization**:
- D3.js force-directed graph
- Bubbles sized by impact
- Colored by life theme
- Interactive drag/combine
- Gamification elements

---

## Known Limitations

1. **Checkpoint system error** - Cannot save checkpoints due to platform issue
2. **Mobile timeline** - Still investigating rendering issue on mobile devices
3. **No bubble UI yet** - Currently using table/card view (Phase 4 will add bubbles)

---

## Files Changed

### New Files:
- `server/ai/wisdomGenerator.ts`
- `drizzle/0019_lethal_blink.sql`

### Modified Files:
- `drizzle/schema.ts` - Added combined_experiences and experience_combinations tables
- `server/experiencesRouter.ts` - Added 4 new endpoints
- `client/src/pages/ExperiencesTest.tsx` - Added Phase 3 UI section

---

## Success Criteria

- ✅ Can select 2+ analyzed experiences
- ✅ AI generates meaningful consolidated wisdom
- ✅ Wisdom focuses on exploration/learning (not closure)
- ✅ Archetypes capture recurring patterns
- ✅ Primary theme correctly identified
- ✅ Combined experiences saved to database
- ✅ Can view all combinations
- ⏳ Test with real user data (pending)

---

**Phase 3 Status:** Ready for user testing! 🎉

