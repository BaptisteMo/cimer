'use client';

/**
 * AddressAutocomplete Component
 *
 * An address input field with autocomplete suggestions powered by the French government's
 * address API (data.gouv.fr).
 *
 * UX BEHAVIOUR - Prevent Unwanted Dropdown on Pre-filled Values:
 * - The dropdown ONLY appears when the user actively focuses the field and starts interacting.
 * - When values are programmatically set (from profile, defaults, previous step navigation):
 *   - The field displays the value
 *   - But the dropdown does NOT automatically appear
 * - This prevents jarring UX where dropdowns pop up unexpectedly on page load or form resets.
 *
 * TRIGGER CONDITIONS:
 * The dropdown appears when ALL of these conditions are met:
 * 1. Field has focus (user clicked into it)
 * 2. Value has at least 3 characters
 * 3. API returned suggestions
 *
 * TESTING:
 * - Open "New CMR" with address pre-filled from profile:
 *   → No dropdown appears until user clicks the address field
 * - Click into an address field and type:
 *   → After 3+ characters, suggestions appear
 * - Click outside the field:
 *   → Dropdown hides
 * - Navigate between wizard steps:
 *   → Values are preserved but dropdown stays closed until user clicks in
 */

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressSuggestion {
  label: string;
  postcode: string | null;
  city: string | null;
  context: string | null;
  lat: number;
  lon: number;
}

interface AddressAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (_value: string) => void;
  onSelectSuggestion?: (_suggestion: AddressSuggestion) => void;
  className?: string;
  required?: boolean;
  error?: string;
}

export function AddressAutocomplete({
  label,
  placeholder = 'Start typing an address...',
  value,
  onChange,
  onSelectSuggestion,
  className,
  required = false,
  error,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  /**
   * isFocused tracks whether the user has actively clicked into this field.
   * This is the key to preventing unwanted dropdown popups on programmatic value changes.
   * Only when isFocused === true will we fetch and display suggestions.
   */
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch suggestions from API with debounce
   *
   * IMPORTANT: We only fetch suggestions when BOTH conditions are met:
   * 1. Field is focused (user actively editing)
   * 2. Value has at least 3 characters
   *
   * This prevents unwanted API calls and dropdown popups when:
   * - Component mounts with a pre-filled value
   * - Value is programmatically updated (form reset, navigation between steps)
   * - User hasn't clicked into the field yet
   */
  useEffect(() => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    /**
     * Don't fetch suggestions if:
     * - Value is too short (< 3 chars)
     * - Field is not focused (user hasn't clicked in yet)
     *
     * This is the key change: we check isFocused to prevent
     * suggestions from appearing on programmatic value changes.
     */
    if (value.trim().length < 3 || !isFocused) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    // Set loading state immediately
    setLoading(true);

    // Debounce API call by 300ms to avoid excessive requests while typing
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/address-search?q=${encodeURIComponent(value)}`);

        if (!response.ok) {
          console.error('Address search API error:', response.status);
          setSuggestions([]);
          setShowDropdown(false);
          return;
        }

        const data = await response.json();
        const fetchedSuggestions = data.features || [];

        setSuggestions(fetchedSuggestions);

        /**
         * Only show dropdown if:
         * - We have suggestions
         * - Field is still focused (user might have clicked away while fetching)
         */
        setShowDropdown(fetchedSuggestions.length > 0 && isFocused);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error('Error fetching address suggestions:', err);
        setSuggestions([]);
        setShowDropdown(false);
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
  }, [value, isFocused]);

  /**
   * Handle click outside to close dropdown
   * This ensures the dropdown hides when user clicks elsewhere on the page.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle focus - user clicked into the field
   * This is when we enable suggestion fetching.
   */
  const handleFocus = () => {
    setIsFocused(true);

    // If field already has a value >= 3 chars, trigger suggestions immediately
    if (value.trim().length >= 3) {
      // The useEffect will handle fetching since isFocused changed
    }
  };

  /**
   * Handle blur - user clicked out of the field
   * We use a small timeout to allow clicking on suggestions before closing.
   */
  const handleBlur = () => {
    // Delay blur to allow suggestion clicks to register
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
    }, 200);
  };

  /**
   * Cleanup blur timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle suggestion selection
   * Called when user clicks a suggestion or presses Enter on highlighted item.
   */
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    // Clear blur timeout if it's pending
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Update the input value
    onChange(suggestion.label);

    // Close dropdown and reset focus state
    setShowDropdown(false);
    setIsFocused(false);
    setHighlightedIndex(-1);

    // Notify parent if callback provided
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
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
      {label && (
        <Label htmlFor="address-autocomplete" className="mb-2 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          ref={inputRef}
          id="address-autocomplete"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(error && 'border-destructive')}
          required={required}
        />

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}

      {/**
       * Dropdown suggestions
       *
       * We only show suggestions when the driver is actively editing the field (focused + typing),
       * not on initial autofill or programmatic value changes.
       *
       * Display conditions:
       * - showDropdown === true (controlled by isFocused + API results)
       * - suggestions.length > 0 (we have results to show)
       */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md"
        >
          <div className="max-h-[300px] overflow-y-auto p-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.label}-${index}`}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className={cn(
                  'flex w-full items-start gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  highlightedIndex === index && 'bg-accent text-accent-foreground'
                )}
              >
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{suggestion.label}</div>
                  {suggestion.context && (
                    <div className="text-xs text-muted-foreground truncate">
                      {suggestion.context}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
