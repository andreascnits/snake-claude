import { useEffect, useRef } from 'react';
import backgroundMusic from '../assets/audio/background-music.mp3';

export const useGameAudio = (isEnabled: boolean) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio on mount
    if (!audioRef.current) {
      audioRef.current = new Audio(backgroundMusic);
      audioRef.current.loop = true;
      
      // Try to play immediately if enabled
      if (isEnabled) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log('Initial audio playback failed:', error);
          });
        }
      }
    }

    // Handle subsequent changes to isEnabled
    if (audioRef.current) {
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
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isEnabled]);

  return audioRef;
}; 