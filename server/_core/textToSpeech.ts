/**
 * Text-to-Speech service for generating meditation audio
 * Supports multiple TTS providers (Google Cloud TTS, ElevenLabs, etc.)
 */

import { storagePut } from "../storage";

interface TTSOptions {
  text: string;
  voice?: string;
  language?: string;
}

/**
 * Generate speech audio from text and upload to S3
 * Returns the public URL of the generated audio file
 */
export async function generateSpeechAudio(options: TTSOptions): Promise<string> {
  const { text, voice = "female", language = "en-US" } = options;

  // Option 1: Google Cloud Text-to-Speech
  if (process.env.GOOGLE_CLOUD_TTS_API_KEY) {
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
      console.log("[TTS] Generated meditation audio:", url);
      return url;
    } catch (error) {
      console.error("[TTS] Failed to generate audio:", error);
      return "";
    }
  }

  // Fallback: Return empty string (will use browser TTS)
  console.warn("[TTS] No TTS API configured. Set GOOGLE_CLOUD_TTS_API_KEY");
  return "";
}

/**
 * Check if TTS service is available
 */
export function isTTSAvailable(): boolean {
  return !!process.env.GOOGLE_CLOUD_TTS_API_KEY;
}
