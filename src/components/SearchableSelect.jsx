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
  const containerRef = useRef(null);
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
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredOptions = options.filter(o => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const labelMatch = o.label && o.label.toLowerCase().includes(term);
    const sublabelMatch = o.sublabel && o.sublabel.toLowerCase().includes(term);
    return labelMatch || sublabelMatch;
  });

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div 
      ref={containerRef} 
      className={`searchable-select-container ${className}`}
      style={{ position: 'relative', width: '100%' }}
    >
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          backgroundColor: disabled ? '#E5EFEF' : isOpen ? '#FFFFFF' : '#F2F9F8',
          border: `1.5px solid ${isOpen ? 'var(--mint-cyan)' : 'var(--border-color)'}`,
          boxShadow: isOpen ? '0 0 0 3px rgba(45, 212, 191, 0.2)' : 'none',
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
              placeholder={`Search...`}
              style={{
                paddingLeft: '2.4rem',
                paddingRight: searchTerm ? '2.2rem' : '0.85rem',
                paddingTop: '0.6rem',
                paddingBottom: '0.6rem',
                fontSize: '0.875rem',
                borderRadius: '10px',
                backgroundColor: '#F2F9F8',
                border: '1px solid var(--border-color)'
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
              filteredOptions.map(o => {
                const isSelected = String(o.value) === String(value);
                return (
                  <div
                    key={o.value}
                    onClick={() => handleSelect(o)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? 'var(--accent-pill)' : '#FFFFFF',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#F2F9F8';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFFFF';
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
