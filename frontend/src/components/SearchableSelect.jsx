import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchableSelect({
  value,
  onValueChange,
  options = [],
  placeholder = 'Search...',
  emptyText = 'No results found',
  className,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      o.label?.toLowerCase().includes(q) ||
      o.value?.toString().toLowerCase().includes(q) ||
      o.searchText?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onValueChange(optionValue);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onValueChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        className={cn(
          'flex h-10 w-full items-center rounded-md border border-input bg-white shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          open && 'ring-2 ring-ring ring-offset-2'
        )}
      >
        <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
          placeholder={selected && !open ? selected.label : placeholder}
          value={open ? search : (selected?.label || '')}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {value && !open && (
          <button
            type="button"
            onClick={handleClear}
            className="mr-1 rounded p-1 hover:bg-accent"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="mr-2 rounded p-1 hover:bg-accent"
          aria-label="Toggle dropdown"
        >
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-input bg-white shadow-lg">
          <ul className="max-h-56 overflow-y-auto p-1">
            {filtered.length > 0 ? (
              filtered.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex w-full cursor-pointer items-center rounded-sm px-3 py-2 text-left text-sm hover:bg-accent',
                      value === option.value && 'bg-primary/10 font-medium text-primary'
                    )}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
