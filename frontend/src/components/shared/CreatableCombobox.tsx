import { useState, useRef, useEffect } from 'react';
import { MagnifyingGlass, Plus, Check } from '@phosphor-icons/react';

interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onCreateOption?: (value: string) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CreatableCombobox({
  options, value, onChange, onCreateOption,
  placeholder = 'Select or type to add…', disabled = false, className = '',
}: Props) {
  const [query, setQuery]           = useState('');
  const [open, setOpen]             = useState(false);
  const [creating, setCreating]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const exactMatch = options.some(o => o.toLowerCase() === query.trim().toLowerCase());
  const canCreate = !!onCreateOption && query.trim().length >= 2 && !exactMatch;

  async function handleCreate() {
    if (!canCreate) return;
    setCreating(true);
    try {
      await onCreateOption!(query.trim());
      onChange(query.trim());
      setOpen(false);
      setQuery('');
    } finally {
      setCreating(false);
    }
  }

  function handleSelect(opt: string) {
    onChange(opt);
    setOpen(false);
    setQuery('');
  }

  const displayValue = open ? query : value;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className={`flex items-center h-11 border-2 rounded-xl bg-white transition-all ${
        open ? 'border-brand-teal ring-2 ring-brand-teal/20' : 'border-slate-200'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <MagnifyingGlass size={15} className="ml-3 text-slate-300 shrink-0" />
        <input
          ref={inputRef}
          className="flex-1 px-2.5 text-sm font-medium text-slate-700 bg-transparent outline-none placeholder:text-slate-300"
          placeholder={value || placeholder}
          value={displayValue}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); if (canCreate) handleCreate(); else if (filtered[0]) handleSelect(filtered[0]); }
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
          }}
          disabled={disabled}
        />
        {value && !open && (
          <button
            type="button"
            onClick={() => { onChange(''); setQuery(''); }}
            className="mr-2 text-slate-300 hover:text-slate-500 transition-colors text-xs px-1"
          >✕</button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {/* Current selection indicator */}
          {value && (
            <div className="px-4 py-2 bg-brand-teal/5 border-b border-slate-100 flex items-center gap-2">
              <Check size={12} weight="bold" className="text-brand-teal" />
              <span className="text-xs font-bold text-brand-teal">{value}</span>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && !canCreate && (
              <p className="px-4 py-3 text-sm text-slate-400">No matches</p>
            )}
            {filtered.map(opt => (
              <button
                key={opt}
                type="button"
                onMouseDown={() => handleSelect(opt)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-between ${opt === value ? 'text-brand-teal font-bold' : 'text-slate-700'}`}
              >
                {opt}
                {opt === value && <Check size={14} weight="bold" className="text-brand-teal" />}
              </button>
            ))}
          </div>

          {canCreate && (
            <button
              type="button"
              onMouseDown={handleCreate}
              disabled={creating}
              className="w-full text-left px-4 py-2.5 text-sm font-bold text-brand-green hover:bg-brand-green/5 border-t border-slate-100 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus size={14} weight="bold" />
              {creating ? 'Adding…' : `Add "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
