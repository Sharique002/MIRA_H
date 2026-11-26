'use client';

import React, { useState } from 'react';
import { FileText, Edit2, Check, RefreshCw } from 'lucide-react';
import { SpokenLanguage, TranslationResponse } from '../../types';
import { AudioPlayer } from '../ui/AudioPlayer';
import { Textarea } from '../ui/Textarea';

interface TranscriptPanelProps {
  translation: TranslationResponse | null;
  targetLanguage: SpokenLanguage;
  onClear: () => void;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  translation,
  targetLanguage,
  onClear,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  const currentText = isEditing
    ? editedText
    : translation?.translated_text || '';

  const handleStartEdit = () => {
    setEditedText(translation?.translated_text || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-ink/10 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-ink/10">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-navy" />
          <h3 className="font-display font-semibold text-sm text-ink">Spoken Translation</h3>
        </div>
        <div className="flex items-center gap-2">
          {translation && (
            <button
              onClick={isEditing ? handleSaveEdit : handleStartEdit}
              className="text-xs font-mono text-ink-muted hover:text-navy flex items-center gap-1"
            >
              {isEditing ? <Check className="w-3.5 h-3.5 text-softgreen" /> : <Edit2 className="w-3.5 h-3.5" />}
              <span>{isEditing ? 'Save' : 'Edit'}</span>
            </button>
          )}
          <button
            onClick={onClear}
            className="text-xs font-mono text-ink-muted hover:text-coral flex items-center gap-1 ml-2"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Transcript Text Box */}
      {isEditing ? (
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={3}
          placeholder="Edit translated transcription..."
        />
      ) : (
        <div className="p-4 rounded-xl bg-cream/40 border border-ink/10 min-h-[90px] flex items-center">
          {currentText ? (
            <p className="text-base font-body text-ink leading-relaxed">
              &ldquo;{currentText}&rdquo;
            </p>
          ) : (
            <p className="text-xs italic text-ink-subtle">
              Recognized sign gestures will translate here into {targetLanguage === 'HI' ? 'Hindi' : 'English'}.
            </p>
          )}
        </div>
      )}

      {/* Evidence & Verification Notice */}
      {translation?.correction_notes && (
        <p className="text-[11px] font-mono text-ink-muted bg-ink/5 p-2 rounded-lg">
          Evidence: {translation.correction_notes}
        </p>
      )}

      {/* Audio Playback Controls */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-ink-muted">Voice Output:</span>
        <AudioPlayer
          textToSpeak={currentText}
          language={targetLanguage}
          disabled={!currentText.trim()}
        />
      </div>
    </div>
  );
};
