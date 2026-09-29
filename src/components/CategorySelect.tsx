'use client';

import { useState, useRef, useEffect } from 'react';

interface CategorySelectProps {
  categories: string[];
  value: string;
  onChange: (cat: string) => void;
}

export default function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="cat-select" ref={ref}>
      <button
        className="cat-select-btn"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span>{value}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.15s' }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="cat-select-menu">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-select-item ${cat === value ? 'active' : ''}`}
              onClick={() => { onChange(cat); setOpen(false); }}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
