'use client';

import React, { useId, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';

export type SearchableMultiSelectOption = {
  id: string;
  label: string;
  subtitle?: string;
  /** Extra text used only for search matching (e.g. specialization, slug) */
  keywords?: string;
};

export interface SearchableMultiSelectProps {
  label?: string;
  required?: boolean;
  options: SearchableMultiSelectOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  helperText?: string;
  error?: string;
  /** When true, the first id in `value` is shown with a primary badge */
  showPrimaryBadge?: boolean;
  primaryBadgeLabel?: string;
  listMaxHeightClass?: string;
  /** Optional: override how an option is matched against the search string */
  getSearchText?: (option: SearchableMultiSelectOption) => string;
}

export function SearchableMultiSelect({
  label,
  required,
  options,
  value,
  onChange,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No items found.',
  helperText,
  error,
  showPrimaryBadge = true,
  primaryBadgeLabel = 'Primary',
  listMaxHeightClass = 'max-h-56',
  getSearchText,
}: SearchableMultiSelectProps) {
  const baseId = useId();
  const searchId = `${baseId}-search`;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const text = getSearchText
        ? getSearchText(opt).toLowerCase()
        : `${opt.label} ${opt.subtitle || ''} ${opt.keywords || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [options, query, getSearchText]);

  const selectedOrdered = useMemo(() => {
    const map = new Map(options.map((o) => [o.id, o] as const));
    return value.map((id) => map.get(id)).filter(Boolean) as SearchableMultiSelectOption[];
  }, [options, value]);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const remove = (id: string) => {
    onChange(value.filter((x) => x !== id));
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={searchId} className="mb-1 block text-sm font-medium text-[var(--foreground)]">
          {label}
          {required ? ' *' : ''}
        </label>
      )}

      <Input
        id={searchId}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        aria-describedby={error ? `${baseId}-error` : helperText ? `${baseId}-help` : undefined}
      />

      <div
        className={`mt-2 overflow-y-auto border border-[var(--border)] bg-[var(--input)] ${listMaxHeightClass}`}
        role="listbox"
        aria-label={label || 'Options'}
        aria-multiselectable="true"
      >
        {filtered.length === 0 ? (
          <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{emptyMessage}</div>
        ) : (
          filtered.map((opt) => {
            const checked = value.includes(opt.id);
            return (
              <label
                key={opt.id}
                className="flex cursor-pointer items-start gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--muted)]/40"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.id)}
                  className="mt-1 rounded-none"
                  aria-checked={checked}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{opt.label}</p>
                  {opt.subtitle ? (
                    <p className="text-xs text-[var(--muted-foreground)]">{opt.subtitle}</p>
                  ) : null}
                </div>
              </label>
            );
          })
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {selectedOrdered.map((opt, idx) => (
          <span
            key={opt.id}
            className="inline-flex items-center gap-2 border border-[var(--border)] bg-[var(--muted)] px-2 py-1 text-xs text-[var(--foreground)]"
          >
            {opt.label}
            {showPrimaryBadge && idx === 0 && (
              <span className="text-[10px] font-medium text-[var(--primary-700)]">({primaryBadgeLabel})</span>
            )}
            <button
              type="button"
              onClick={() => remove(opt.id)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label={`Remove ${opt.label}`}
            >
              ×
            </button>
          </span>
        ))}
        {selectedOrdered.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-red-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {error ? (
        <p id={`${baseId}-error`} className="mt-1 text-sm text-[var(--error)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${baseId}-help`} className="mt-1 text-sm text-[var(--muted-foreground)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
