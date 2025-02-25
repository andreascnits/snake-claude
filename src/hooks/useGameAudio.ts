import { useEffect, useRef, useCallback } from 'react';
import backgroundMusic from '../assets/audio/background-music.mp3';

export const useGameAudio = (isEnabled: boolean) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef<boolean>(false);

  // Initialize audio on mount, but don't play yet
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(backgroundMusic);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5; // Set a reasonable volume
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle changes to isEnabled
  useEffect(() => {
    if (!audioRef.current || !hasInteractedRef.current) return;

    if (isEnabled) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('Audio playback failed:', error);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isEnabled]);

  // Function to be called after user interaction
  const initializeAudio = useCallback(() => {
    hasInteractedRef.current = true;
    
    if (audioRef.current && isEnabled) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('Audio playback failed after interaction:', error);
        });
      }
    }
  }, [isEnabled]);

  return { audioRef, initializeAudio };
}; 