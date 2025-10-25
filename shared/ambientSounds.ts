// Ambient sound options for meditation
export const AMBIENT_SOUNDS = {
  "none": {
    "name": "No Background Music",
    "url": null,
    "description": "Voice only"
  },
  "rain": {
    "name": "Gentle Rain",
    "url": "https://cdn.pixabay.com/download/audio/2022/05/13/audio_c0d4c0e5e6.mp3",
    "description": "Soft rainfall sounds"
  },
  "ocean": {
    "name": "Ocean Waves",
    "url": "https://cdn.pixabay.com/download/audio/2022/03/10/audio_2c0a81c372.mp3",
    "description": "Calming ocean waves"
  },
  "forest": {
    "name": "Forest Ambience",
    "url": "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8dbf3cb3c.mp3",
    "description": "Birds and nature sounds"
  },
  "singing_bowls": {
    "name": "Singing Bowls",
    "url": "https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3",
    "description": "Tibetan singing bowls"
  },
  "piano": {
    "name": "Soft Piano",
    "url": "https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3",
    "description": "Gentle piano meditation music"
  }
} as const;

export type AmbientSoundKey = keyof typeof AMBIENT_SOUNDS;
