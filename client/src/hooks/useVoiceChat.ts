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
  const lastProcessedIndexRef = useRef(0);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true; // Keep listening until user stops manually
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let newFinalTranscript = '';

          // Only process results we haven't seen before
          const startIndex = Math.max(event.resultIndex, lastProcessedIndexRef.current);
          
          for (let i = startIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newFinalTranscript += transcript + ' ';
              lastProcessedIndexRef.current = i + 1; // Mark this result as processed
            } else {
              interimTranscript += transcript;
            }
          }

          // Append final results to our accumulated final transcript
          if (newFinalTranscript) {
            finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + newFinalTranscript).trim();
          }

          // Display: accumulated final + current interim
          setTranscript((finalTranscriptRef.current + ' ' + interimTranscript).trim());
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

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      finalTranscriptRef.current = '';
      lastProcessedIndexRef.current = 0; // Reset processed index
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const generateSpeech = trpc.textToSpeech.generate.useMutation();

  const speak = async (text: string, voiceId: string = 'rachel') => {
    try {
      setIsSpeaking(true);
      
      // Generate speech using trpc
      const result = await generateSpeech.mutateAsync({ text, voiceId });
      
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

