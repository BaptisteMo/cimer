'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyData {
  siren: string;
  siret: string | null;
  name: string;
  address: string;
  postcode: string | null;
  city: string | null;
  naf: string | null;
}

interface CompanySearchFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (_value: string) => void;
  onSelectCompany?: (_company: CompanyData) => void;
  className?: string;
  required?: boolean;
  error?: string;
}

export function CompanySearchField({
  label = 'Search your company',
  placeholder = 'Company name or SIRET...',
  value,
  onChange,
  onSelectCompany,
  className,
  required = false,
  error,
}: CompanySearchFieldProps) {
  const [suggestions, setSuggestions] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [noResults, setNoResults] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions from API with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't fetch if value is too short or user hasn't interacted
    if (value.trim().length < 2 || !hasInteracted) {
      setSuggestions([]);
      setShowDropdown(false);
      setNoResults(false);
      return;
    }

    // Set loading state immediately
    setLoading(true);
    setNoResults(false);

    // Debounce API call by 300ms
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/company-search?q=${encodeURIComponent(value)}`);

        if (!response.ok) {
          console.error('Company search API error:', response.status);
          setSuggestions([]);
          setShowDropdown(false);
          setNoResults(true);
          return;
        }

        const data = await response.json();
        const results = data.results || [];

        setSuggestions(results);
        setShowDropdown(results.length > 0);
        setNoResults(results.length === 0);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error('Error fetching company suggestions:', err);
        setSuggestions([]);
        setShowDropdown(false);
        setNoResults(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, hasInteracted]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (company: CompanyData) => {
    onChange(company.name);
    setSelectedCompany(company);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setNoResults(false);

    if (onSelectCompany) {
      onSelectCompany(company);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Label htmlFor="company-search" className="mb-2 block">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <div className="relative">
        <Input
          ref={inputRef}
          id="company-search"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            setHasInteracted(true);
            onChange(e.target.value);
            setSelectedCompany(null); // Clear selection when user types
          }}
          onKeyDown={handleKeyDown}
          className={cn(error && 'border-destructive')}
          required={required}
        />

        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Selected indicator */}
        {!loading && selectedCompany && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}

      {/* No results message */}
      {noResults && value.trim().length >= 2 && !loading && (
        <p className="mt-2 text-sm text-muted-foreground">
          No company found. You can fill your information manually.
        </p>
      )}

      {/* Dropdown suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md"
        >
          <div className="max-h-[300px] overflow-y-auto p-1">
            {suggestions.map((company, index) => (
              <button
                key={`${company.siren}-${index}`}
                type="button"
                onClick={() => handleSelectSuggestion(company)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-sm px-3 py-3 text-left transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  highlightedIndex === index && 'bg-accent text-accent-foreground'
                )}
              >
                <Building2 className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{company.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {company.address}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    {company.siret && (
                      <span>SIRET: {company.siret}</span>
                    )}
                    {company.naf && (
                      <span>NAF: {company.naf}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
