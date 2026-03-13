'use client';

import React from 'react';

export function CalculatingView({ message = 'Calculating…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="flex flex-col items-center gap-3 text-[var(--muted-foreground)]">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--primary-500)] border-t-transparent animate-spin" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

