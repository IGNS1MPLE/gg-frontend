import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X, AlertCircle } from 'lucide-react';

export default function SearchableSelect({
  options = [], // [{ value, label, sublabel, badge }]
  value,
  onChange,
  placeholder = "Search or select...",
  required = false,
  disabled = false,
  icon: IconComponent = null,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  const filteredOptions = options.filter(o => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const labelMatch = o.label && o.label.toLowerCase().includes(term);
    const sublabelMatch = o.sublabel && o.sublabel.toLowerCase().includes(term);
    return labelMatch || sublabelMatch;
  });

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
    triggerRef.current?.focus();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    triggerRef.current?.focus();
  };

  // Keyboard navigation on trigger button (when closed/focused)
  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  // Keyboard navigation inside dropdown search
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, Math.max(0, filteredOptions.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0 && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      // Move focus forward or backward relative to triggerRef
      const focusable = Array.from(document.querySelectorAll(
        'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]:not([disabled])'
      ));
      const currentIndex = focusable.indexOf(triggerRef.current);
      if (currentIndex !== -1) {
        e.preventDefault();
        const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
        if (focusable[nextIndex]) {
          focusable[nextIndex].focus();
        }
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`searchable-select-container ${className}`}
      style={{ position: 'relative', width: '100%' }}
    >
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          backgroundColor: disabled ? '#E5EFEF' : isOpen ? '#FFFFFF' : '#F2F9F8',
          border: `1.5px solid ${(isOpen || isFocused) ? 'var(--mint-cyan)' : 'var(--border-color)'}`,
          boxShadow: (isOpen || isFocused) ? '0 0 0 3px rgba(45, 212, 191, 0.25)' : 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          padding: '0.75rem 1rem',
          borderRadius: '14px',
          fontFamily: 'inherit',
          fontSize: '0.925rem',
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {IconComponent && <IconComponent size={18} color={selectedOption ? 'var(--accent-color)' : 'var(--text-secondary)'} style={{ flexShrink: 0 }} />}
          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whitespace: 'nowrap' }}>
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  ({selectedOption.sublabel})
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>{placeholder}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {selectedOption && !required && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown 
            size={18} 
            color="var(--text-secondary)" 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
              transition: 'transform 0.2s ease' 
            }} 
          />
        </div>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(24, 56, 51, 0.15)',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          maxHeight: '300px'
        }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={16} 
              color="var(--text-secondary)" 
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={`Search...`}
              style={{
                paddingLeft: '2.4rem',
                paddingRight: searchTerm ? '2.2rem' : '0.85rem',
                paddingTop: '0.6rem',
                paddingBottom: '0.6rem',
                fontSize: '0.875rem',
                borderRadius: '10px',
                backgroundColor: '#F2F9F8',
                border: '1px solid var(--border-color)',
                outline: 'none'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{
            overflowY: 'auto',
            maxHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No options found matching "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((o, index) => {
                const isSelected = String(o.value) === String(value);
                const isHighlighted = index === highlightedIndex;
                return (
                  <div
                    key={o.value}
                    onClick={() => handleSelect(o)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? 'var(--accent-pill)' : isHighlighted ? '#F2F9F8' : '#FFFFFF',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{o.label}</span>
                        {isSelected && <Check size={16} color="var(--accent-color)" />}
                      </div>
                      {o.sublabel && (
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                          {o.sublabel}
                        </div>
                      )}
                    </div>
                    {o.badge && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(27, 56, 52, 0.08)', color: 'var(--text-primary)' }}>
                        {o.badge}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
