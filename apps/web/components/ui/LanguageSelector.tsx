import React from 'react';
import { SignLanguage, SpokenLanguage } from '../../types';

interface LanguageSelectorProps {
  signLanguage: SignLanguage;
  spokenLanguage: SpokenLanguage;
  onSignLanguageChange: (lang: SignLanguage) => void;
  onSpokenLanguageChange: (lang: SpokenLanguage) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  signLanguage,
  spokenLanguage,
  onSignLanguageChange,
  onSpokenLanguageChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-2 bg-cream/70 rounded-xl border border-ink/10">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Sign:</span>
        <div className="inline-flex rounded-lg border border-ink/15 p-0.5 bg-white">
          <button
            type="button"
            onClick={() => onSignLanguageChange('ISL')}
            disabled={disabled}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              signLanguage === 'ISL'
                ? 'bg-navy text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            ISL (Indian)
          </button>
          <button
            type="button"
            onClick={() => onSignLanguageChange('ASL')}
            disabled={disabled}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              signLanguage === 'ASL'
                ? 'bg-navy text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            ASL (American)
          </button>
        </div>
      </div>

      <div className="h-4 w-[1px] bg-ink/15 hidden sm:block" />

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Spoken:</span>
        <div className="inline-flex rounded-lg border border-ink/15 p-0.5 bg-white">
          <button
            type="button"
            onClick={() => onSpokenLanguageChange('EN')}
            disabled={disabled}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              spokenLanguage === 'EN'
                ? 'bg-violet text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onSpokenLanguageChange('HI')}
            disabled={disabled}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              spokenLanguage === 'HI'
                ? 'bg-violet text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Hindi (हिंदी)
          </button>
        </div>
      </div>
    </div>
  );
};
