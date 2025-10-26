/**
 * Text-to-Speech service for generating meditation audio
 * Supports multiple TTS providers (ElevenLabs, Google Cloud TTS)
 */

import { storagePut } from "../storage";
import { getElevenLabsVoiceId } from "@shared/voiceOptions";

interface TTSOptions {
  text: string;
  voiceId?: string; // Voice ID from voiceOptions
  language?: string;
  provider?: "elevenlabs" | "google" | "browser"; // Preferred provider
}

/**
 * Generate speech audio from text and upload to S3
 * Returns the public URL of the generated audio file
 */
export async function generateSpeechAudio(options: TTSOptions): Promise<string> {
  const { text, voiceId = "rachel", language = "en-US", provider = "elevenlabs" } = options;

  // Option 1: ElevenLabs (highest quality, most natural)
  if (provider === "elevenlabs" && process.env.ELEVENLABS_API_KEY) {
    try {
      // If voiceId looks like an ElevenLabs ID (starts with uppercase or number), use it directly
      // Otherwise, map it from our voice options
      const elevenLabsVoiceId = /^[A-Z0-9]/.test(voiceId) ? voiceId : getElevenLabsVoiceId(voiceId);
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.85, // Higher stability for calm, consistent voice
              similarity_boost: 0.60, // Lower for softer, more serene tone
              style: 0.0,
              use_speaker_boost: false, // Disable for gentler voice
            },
          }),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[TTS] ElevenLabs error:", errorText);
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }
      
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      
      // Upload to S3
      const fileName = `meditation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`;
      const { url } = await storagePut(`meditations/${fileName}`, audioBuffer, "audio/mpeg");
      console.log("[TTS] Generated meditation audio with ElevenLabs:", url);
      return url;
    } catch (error) {
      console.error("[TTS] ElevenLabs failed, trying fallback:", error);
      // Continue to fallback options
    }
  }

  // Option 2: Google Cloud Text-to-Speech (fallback)
  if (provider === "google" && process.env.GOOGLE_CLOUD_TTS_API_KEY) {
    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_CLOUD_TTS_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: language,
              name: "en-US-Neural2-F", // Female neural voice
              ssmlGender: "FEMALE",
            },
            audioConfig: {
              audioEncoding: "MP3",
              speakingRate: 0.80, // Slower for meditation
              pitch: 0,
            },
          }),
        }
      );
      
      const data = await response.json();
      
      if (data.error) {
        console.error("[TTS] Google Cloud TTS error:", data.error);
        return "";
      }
      
      const audioBuffer = Buffer.from(data.audioContent, "base64");
      
      // Upload to S3
      const fileName = `meditation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`;
      const { url } = await storagePut(`meditations/${fileName}`, audioBuffer, "audio/mpeg");
      console.log("[TTS] Generated meditation audio with Google TTS:", url);
      return url;
    } catch (error) {
      console.error("[TTS] Failed to generate audio:", error);
      return "";
    }
  }

  // Fallback: Return empty string (will use browser TTS)
  if (provider === "browser") {
    console.log("[TTS] Browser TTS selected, returning empty string");
    return "";
  }
  console.warn("[TTS] No TTS API configured or provider not available. Set ELEVENLABS_API_KEY or GOOGLE_CLOUD_TTS_API_KEY");
  return "";
}

/**
 * Check if TTS service is available
 */
export function isTTSAvailable(): boolean {
  return !!(process.env.ELEVENLABS_API_KEY || process.env.GOOGLE_CLOUD_TTS_API_KEY);
}
