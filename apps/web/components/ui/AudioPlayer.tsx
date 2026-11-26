import React, { useState } from 'react';
import { Volume2, VolumeX, Square } from 'lucide-react';
import { Button } from './Button';

interface AudioPlayerProps {
  textToSpeak: string;
  language: 'EN' | 'HI';
  disabled?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  textToSpeak,
  language,
  disabled = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!textToSpeak.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'HI' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-coral font-medium">
        <VolumeX className="w-4 h-4" />
        <span>Speech synthesis unavailable in browser</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSpeak}
      disabled={disabled || !textToSpeak.trim()}
      className="flex items-center gap-2"
      aria-label={isPlaying ? 'Stop speech playback' : 'Play spoken translation'}
    >
      {isPlaying ? (
        <>
          <Square className="w-3.5 h-3.5 fill-coral text-coral" />
          <span>Stop Voice</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-navy" />
          <span>Speak ({language === 'HI' ? 'हिंदी' : 'EN'})</span>
        </>
      )}
    </Button>
  );
};
