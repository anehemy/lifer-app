import { useState, useEffect, useRef } from 'react';
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

  const speak = async (text: string, voiceId: string = 'rachel', provider?: "elevenlabs" | "google" | "browser") => {
    try {
      setIsSpeaking(true);
      
      // Get provider from localStorage if not specified
      const selectedProvider = provider || (localStorage.getItem("voiceProvider") as "elevenlabs" | "google" | "browser") || "elevenlabs";
      
      // Generate speech using trpc
      const result = await generateSpeech.mutateAsync({ text, voiceId, provider: selectedProvider });
      
      if (!result.audioUrl) {
        throw new Error('No audio URL returned');
      }

      // Play audio
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
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
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

