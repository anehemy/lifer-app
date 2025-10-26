/**
 * ElevenLabs voice options for meditation TTS
 * Each voice has a unique ID and characteristics
 */

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  elevenLabsId: string;
}

// Get voice IDs from environment variables, with fallbacks to ElevenLabs default voices
const getEnvVoiceId = (envVar: string, fallback: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[envVar] || fallback;
  }
  return fallback;
};

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "rachel",
    name: "Rachel",
    description: "Calm, soothing female voice - perfect for meditation",
    elevenLabsId: getEnvVoiceId('VITE_MEDITATION_VOICE_RACHEL', '21m00Tcm4TlvDq8ikWAM'),
  },
  {
    id: "bella",
    name: "Bella",
    description: "Soft, gentle female voice - warm and comforting",
    elevenLabsId: getEnvVoiceId('VITE_MEDITATION_VOICE_BELLA', 'EXAVITQu4vr4xnSDxMaL'),
  },
  {
    id: "antoni",
    name: "Antoni",
    description: "Deep, calming male voice - grounding and peaceful",
    elevenLabsId: getEnvVoiceId('VITE_MEDITATION_VOICE_ANTONI', 'ErXwobaYiN019PkySvjV'),
  },
  {
    id: "elli",
    name: "Elli",
    description: "Clear, serene female voice - mindful and present",
    elevenLabsId: getEnvVoiceId('VITE_MEDITATION_VOICE_ELLI', 'MF3mGyEYCl7XYWbV9V6O'),
  },
  {
    id: "josh",
    name: "Josh",
    description: "Warm, reassuring male voice - steady and supportive",
    elevenLabsId: getEnvVoiceId('VITE_MEDITATION_VOICE_JOSH', 'TxGEqnHWrfWFTfGW9XjX'),
  },
  {
    id: "domi",
    name: "Domi",
    description: "Gentle, nurturing female voice - compassionate and kind",
    elevenLabsId: getEnvVoiceId('VITE_MEDITATION_VOICE_DOMI', 'AZnzlk1XvdvUeBnXmlld'),
  },
];

export const DEFAULT_VOICE_ID = "rachel";

export function getVoiceById(id: string): VoiceOption | undefined {
  return VOICE_OPTIONS.find(v => v.id === id);
}

export function getElevenLabsVoiceId(voiceId: string): string {
  const voice = getVoiceById(voiceId);
  return voice?.elevenLabsId || VOICE_OPTIONS[0].elevenLabsId; // Default to Rachel
}

