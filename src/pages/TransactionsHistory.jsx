import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { 
  ArrowLeft, Search, Filter, Truck, RotateCcw, Banknote, 
  ShoppingBag, Receipt, ExternalLink, ChevronLeft, ChevronRight, 
  RefreshCw, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function TransactionsHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Fetch up to 500 recent transactions
      const data = await api.get('/analytics/recent-transactions?limit=500');
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch (e) {
      console.error('Error fetching transactions history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getTxConfig = (type) => {
    switch (type) {
      case 'Distribution':
        return { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', amountColor: '#183833', icon: <Truck size={14} /> };
      case 'Return':
        return { color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', amountColor: '#10B981', icon: <RotateCcw size={14} /> };
      case 'Collection':
        return { color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', amountColor: '#10B981', icon: <Banknote size={14} /> };
      case 'Purchase':
        return { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', amountColor: '#EF4444', icon: <ShoppingBag size={14} /> };
      case 'Expense':
        return { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', amountColor: '#EF4444', icon: <Receipt size={14} /> };
      default:
        return { color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB', amountColor: '#183833', icon: <FileText size={14} /> };
    }
  };

  const handleReferenceClick = (tx) => {
    switch (tx.type_category) {
      case 'distribution':
        navigate('/distribution');
        break;
      case 'return':
        navigate('/returns');
        break;
      case 'collection':
        navigate('/collections');
        break;
      case 'purchase':
        navigate('/inventory');
        break;
      case 'expense':
        navigate('/expenses');
        break;
      default:
        break;
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: transactions.length, distribution: 0, return: 0, collection: 0, purchase: 0, expense: 0 };
    transactions.forEach(t => {
      if (counts[t.type_category] !== undefined) {
        counts[t.type_category]++;
      }
    });
    return counts;
  }, [transactions]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(tx => {
      // Category filter
      if (selectedCategory !== 'all' && tx.type_category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesRef = tx.reference?.toLowerCase().includes(query);
        const matchesParty = tx.party?.toLowerCase().includes(query);
        const matchesAmount = tx.amount?.toLowerCase().includes(query);
        const matchesType = tx.type?.toLowerCase().includes(query);
        if (!matchesRef && !matchesParty && !matchesAmount && !matchesType) {
          return false;
        }
      }
      return true;
    });

    if (sortOrder === 'oldest') {
      result = [...result].reverse();
    }
    return result;
  }, [transactions, selectedCategory, search, sortOrder]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const categoriesList = [
    { id: 'all', label: 'All Transactions', count: categoryCounts.all, icon: null },
    { id: 'distribution', label: 'Distribution', count: categoryCounts.distribution, icon: <Truck size={14} /> },
    { id: 'return', label: 'Return', count: categoryCounts.return, icon: <RotateCcw size={14} /> },
    { id: 'collection', label: 'Collection', count: categoryCounts.collection, icon: <Banknote size={14} /> },
    { id: 'purchase', label: 'Purchase', count: categoryCounts.purchase, icon: <ShoppingBag size={14} /> },
    { id: 'expense', label: 'Expense', count: categoryCounts.expense, icon: <Receipt size={14} /> }
  ];

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Bar with Back Button & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            style={{ padding: '0.45rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            title="Go back"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Transactions History
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Complete audit log of inventory dispatches, returns, cash collections, purchases, and expenses.
            </p>
          </div>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={fetchTransactions} 
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {/* Category Tabs / Chip Filter */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {categoriesList.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--accent-color)' : '3px solid transparent',
                background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat.icon}
              {cat.label}
              <span style={{
                background: isActive ? 'var(--accent-color)' : 'var(--border-color)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                borderRadius: '9999px',
                padding: '0.1rem 0.45rem',
                fontSize: '0.7rem',
                fontWeight: 700
              }}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Card with Search Bar & Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        
        {/* Filter Controls Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          
          {/* Search Box */}
          <div className="topbar-search" style={{ margin: 0, width: '100%', maxWidth: '380px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search reference, party, type or amount..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort & Quick Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Showing {filteredTransactions.length} {filteredTransactions.length === 1 ? 'record' : 'records'}
            </span>
            <select 
              value={sortOrder} 
              onChange={e => setSortOrder(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '0.825rem',
                background: 'var(--card-bg, #fff)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Transaction Type
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reference
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Party / Details
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Amount / Units
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Date & Time
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((tx, idx) => {
                const cfg = getTxConfig(tx.type);
                return (
                  <tr key={tx.id || idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                    
                    {/* Type Column with Icon Badge */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: cfg.color,
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {cfg.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {tx.type}
                          </div>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`
                          }}>
                            {tx.type_category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Reference Column (Clickable Link) */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <button
                        onClick={() => handleReferenceClick(tx)}
                        style={{
                          background: 'rgba(37, 99, 235, 0.08)',
                          border: '1px solid rgba(37, 99, 235, 0.3)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.6rem',
                          color: '#2563EB',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                        title={`Open related ${tx.type} record`}
                      >
                        {tx.reference}
                        <ExternalLink size={11} />
                      </button>
                    </td>

                    {/* Party Column */}
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {tx.party}
                    </td>

                    {/* Amount / Units Column */}
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 800, fontSize: '0.9rem', color: cfg.amountColor }}>
                      {tx.amount}
                    </td>

                    {/* Time / Date Column */}
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      <div>{tx.time}</div>
                      {tx.raw_date && (
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                          {tx.raw_date}
                        </div>
                      )}
                    </td>

                    {/* Action Column */}
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleReferenceClick(tx)}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        View <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Empty State */}
              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                      <AlertCircle size={36} opacity={0.35} />
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        No Transactions Found
                      </div>
                      <div style={{ fontSize: '0.85rem', maxWidth: '380px' }}>
                        {search 
                          ? `No transactions match your search query "${search}".`
                          : selectedCategory !== 'all' 
                            ? `No transaction entries recorded under category "${selectedCategory}".`
                            : 'No recent transactions recorded in the system.'}
                      </div>
                      {(search || selectedCategory !== 'all') && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                          style={{ marginTop: '0.5rem', fontSize: '0.825rem' }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1.25rem',
            marginTop: '0.5rem',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} entries
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                style={{ padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <div style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Page {currentPage} of {totalPages}
              </div>

              <button
                className="btn btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                style={{ padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
