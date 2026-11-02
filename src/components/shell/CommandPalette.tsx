import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Film, Upload, History, BookOpen, User, X } from 'lucide-react';

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open if parent allows
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { label: 'Analyze a rehearsal', path: '/upload', icon: Upload, group: 'Actions' },
    { label: 'View Rehearsal History', path: '/history', icon: History, group: 'Navigation' },
    { label: 'Methodology & Open Formulas', path: '/methodology', icon: BookOpen, group: 'Navigation' },
    { label: 'Product pitch sample (Solid 74)', path: '/samples/product-pitch', icon: Film, group: 'Samples' },
    { label: 'Thesis update sample (Developing 61)', path: '/samples/thesis-update', icon: Film, group: 'Samples' },
    { label: 'Lab update sample (Developing 69)', path: '/samples/lab-update', icon: Film, group: 'Samples' },
    { label: 'Sign in / Switch account', path: '/login', icon: User, group: 'Account' },
  ];

  const filtered = items.filter((it) =>
    it.label.toLowerCase().includes(query.toLowerCase()) || it.group.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#02050B]/80 backdrop-blur-md flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0B1A2D] border border-[#17324F] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#17324F]">
          <Search className="w-4 h-4 text-[#79C8DF] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, views, or samples..."
            className="w-full bg-transparent text-sm text-[#F7FAFC] placeholder-[#7C93A9] focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[#7C93A9] hover:text-[#F7FAFC] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs font-mono text-[#7C93A9]">
              No matching commands.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(item.path)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#10243B] text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#79C8DF] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-[#F7FAFC]">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#537FA5] uppercase">
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function SkipLink() {
  return (
    <a
      href="#content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-[#79C8DF] text-[#07111F] px-4 py-2 rounded-lg font-mono text-xs font-bold shadow-xl"
    >
      Skip to main content
    </a>
  );
}
