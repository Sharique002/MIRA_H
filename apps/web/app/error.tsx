'use client';

import React from 'react';
import { Button } from '../components/ui/Button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-coral/20 text-coral flex items-center justify-center font-display font-bold text-2xl mb-4">
        !
      </div>
      <h2 className="font-display font-bold text-2xl text-ink mb-2">Unexpected Application Error</h2>
      <p className="text-sm text-ink-muted max-w-md mb-6 leading-relaxed">
        {error.message || 'An error occurred while rendering this interface component.'}
      </p>
      <Button variant="danger" onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  );
}
