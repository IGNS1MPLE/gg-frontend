import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X, Package, Tag, AlertCircle } from 'lucide-react';

export default function ProductSearchSelect({
  products = [],
  value,
  onChange,
  placeholder = "Search or select a product...",
  required = false,
  disabled = false,
  showStock = true,
  showPrice = true,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find currently selected product object
  const selectedProduct = products.find(p => String(p.id) === String(value));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Derive unique categories
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category || 'General')))];

  // Filter products based on search term & category filter
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || (p.category || 'General') === selectedCategory;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.toLowerCase().includes(term));
    
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm, selectedCategory]);

  const handleSelect = (product) => {
    onChange(product.id);
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
      setHighlightedIndex(prev => Math.min(prev + 1, Math.max(0, filteredProducts.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts.length > 0 && filteredProducts[highlightedIndex]) {
        handleSelect(filteredProducts[highlightedIndex]);
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false);
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
      className={`product-search-select-container ${className}`}
      style={{ position: 'relative', width: '100%' }}
    >
      {/* Selected Box / Control Display */}
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
          <Package size={18} color={selectedProduct ? 'var(--accent-color)' : 'var(--text-secondary)'} style={{ flexShrink: 0 }} />
          {selectedProduct ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whitespace: 'nowrap' }}>
                {selectedProduct.name}
              </span>
              {selectedProduct.category && (
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.5rem',
                  background: 'rgba(27, 56, 52, 0.08)',
                  color: 'var(--text-secondary)',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}>
                  {selectedProduct.category}
                </span>
              )}
              {showStock && selectedProduct.current_stock !== undefined && (
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.5rem',
                  background: selectedProduct.current_stock > 10 ? 'var(--success-bg)' : selectedProduct.current_stock > 0 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                  color: selectedProduct.current_stock > 10 ? 'var(--success-color)' : selectedProduct.current_stock > 0 ? 'var(--warning-color)' : 'var(--danger-color)',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}>
                  Stock: {selectedProduct.current_stock}
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>{placeholder}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {selectedProduct && !required && !disabled && (
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

      {/* Dropdown Menu Popup */}
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
          maxHeight: '340px',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {/* Search Box Input inside dropdown */}
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
              placeholder="Search product name, category, or barcode..."
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

          {/* Quick Category Filter Pills */}
          {categories.length > 2 && (
            <div style={{
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto',
              paddingBottom: '0.2rem',
              scrollbarWidth: 'none'
            }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    backgroundColor: selectedCategory === cat ? 'var(--accent-color)' : '#F2F9F8',
                    color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Filtered Products List */}
          <div style={{
            overflowY: 'auto',
            maxHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}>
            {filteredProducts.length === 0 ? (
              <div style={{
                padding: '1.5rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <AlertCircle size={24} style={{ opacity: 0.5 }} />
                <div>No products found matching "{searchTerm}"</div>
              </div>
            ) : (
              filteredProducts.map((p, index) => {
                const isSelected = String(p.id) === String(value);
                const isHighlighted = index === highlightedIndex;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? 'var(--accent-pill)' : isHighlighted ? '#F2F9F8' : '#FFFFFF',
                      transition: 'background-color 0.15s ease',
                      border: isSelected ? '1px solid var(--mint-cyan)' : '1px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>{p.name}</span>
                        {isSelected && <Check size={16} color="var(--accent-color)" />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                        <span style={{
                          background: 'rgba(27, 56, 52, 0.06)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 500
                        }}>
                          {p.category || 'General'}
                        </span>
                        {p.barcode && <span>• Code: {p.barcode}</span>}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                      {showPrice && p.selling_price !== undefined && (
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          ₹{Number(p.selling_price).toFixed(2)}
                        </div>
                      )}
                      {showStock && p.current_stock !== undefined && (
                        <span style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.45rem',
                          borderRadius: '9999px',
                          backgroundColor: p.current_stock > 10 ? 'var(--success-bg)' : p.current_stock > 0 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                          color: p.current_stock > 10 ? 'var(--success-color)' : p.current_stock > 0 ? 'var(--warning-color)' : 'var(--danger-color)'
                        }}>
                          {p.current_stock > 0 ? `${p.current_stock} in stock` : 'Out of stock'}
                        </span>
                      )}
                    </div>
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
