import { useState, useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

export function useVoiceChat() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finalTranscriptRef = useRef('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousTranscriptRef = useRef(''); // Store previous text for append mode

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false; // Disabled to prevent duplication on mobile
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onresult = (event: any) => {
          // Clear any existing silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // With interim results disabled, we only get final results
          let finalText = '';

          // Process ALL results from the beginning each time
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalText += event.results[i][0].transcript + ' ';
            }
          }

          // Update and display the final transcript
          if (finalText.trim()) {
            finalTranscriptRef.current = finalText.trim();
            // Combine with previous transcript (append mode)
            const combinedText = previousTranscriptRef.current 
              ? previousTranscriptRef.current + ' ' + finalTranscriptRef.current
              : finalTranscriptRef.current;
            setTranscript(combinedText);
          }

          // Set 10-second silence timer to auto-stop
          silenceTimerRef.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
              recognitionRef.current.stop();
            }
          }, 10000); // 10 seconds
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        setError('Speech recognition not supported in this browser');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = (appendMode: boolean = false) => {
    if (recognitionRef.current && !isListening) {
      if (!appendMode) {
        // Clear everything if not in append mode
        setTranscript('');
        previousTranscriptRef.current = '';
      } else {
        // Store current transcript to append to
        previousTranscriptRef.current = transcript;
      }
      finalTranscriptRef.current = '';
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const generateSpeech = trpc.textToSpeech.generate.useMutation();

  const speak = useCallback(async (text: string, voiceId: string = 'rachel', provider?: "elevenlabs" | "google" | "browser") => {
    try {
      setIsSpeaking(true);
      
      // Get provider from localStorage if not specified
      const selectedProvider = provider || (localStorage.getItem("voiceProvider") as "elevenlabs" | "google" | "browser") || "elevenlabs";
      const googleVoice = localStorage.getItem("googleVoice") || "en-US-Neural2-J";
      const elevenLabsVoice = localStorage.getItem("elevenLabsVoice") || "VQypEoV1u8Wo9oGgDmW0";
      
      // Use selected voice for ElevenLabs, or fallback to provided voiceId
      const effectiveVoiceId = selectedProvider === "elevenlabs" ? elevenLabsVoice : voiceId;
      
      // Generate speech using trpc
      const result = await generateSpeech.mutateAsync({ 
        text, 
        voiceId: effectiveVoiceId, 
        provider: selectedProvider,
        googleVoice: selectedProvider === "google" ? googleVoice : undefined
      });
      
      if (!result.audioUrl) {
        // Fallback to browser TTS when no audio URL is returned
        console.log('[TTS] No audio URL, using browser speech synthesis');
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9; // Slightly slower for better clarity
          utterance.pitch = 1.0;
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = (event) => {
            console.error('[TTS] Browser TTS error:', event);
            // Don't show error to user for browser TTS - it's expected on some mobile browsers
            setIsSpeaking(false);
          };
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn('[TTS] Speech synthesis not available');
          setIsSpeaking(false);
        }
        return;
      }

      // Play audio from URL
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(result.audioUrl);
      audioRef.current.onended = () => setIsSpeaking(false);
      audioRef.current.onerror = () => {
        setError('Failed to play audio');
        setIsSpeaking(false);
      };
      
      await audioRef.current.play();
    } catch (err) {
      console.error('Text-to-speech error:', err);
      setError('Failed to generate speech');
      setIsSpeaking(false);
    }
  }, [generateSpeech]);

  const stopSpeaking = () => {
    // Stop audio URL playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Stop browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return {
    isListening,
    isSpeaking,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}

