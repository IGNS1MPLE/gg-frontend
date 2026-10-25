import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Settings, ShieldCheck, Clock, Check, X, RefreshCw, AlertCircle, Sparkles, Database } from 'lucide-react';

export default function SettingsPage() {
  const [autoCleanup, setAutoCleanup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const currentUser = (() => {
    try {
      const saved = localStorage.getItem('app_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.email?.toLowerCase().includes('admin');

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await api.get('/settings/auto_cleanup_purchases_30_days').catch(() => null);
        if (res && res.value) {
          setAutoCleanup(res.value.toLowerCase() === 'true');
        } else {
          setAutoCleanup(false);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleToggleAutoCleanup = async () => {
    if (!isAdmin) {
      alert('Admin access required to change system settings.');
      return;
    }
    const nextVal = !autoCleanup;
    setAutoCleanup(nextVal);
    setSaving(true);
    try {
      await api.post('/settings/', {
        key: 'auto_cleanup_purchases_30_days',
        value: nextVal ? 'true' : 'false',
        description: 'Auto-delete restock history older than 30 days'
      });
      setToastMessage(
        nextVal
          ? 'Auto-cleanup enabled: Restock history older than 30 days will be cleaned automatically.'
          : 'Auto-cleanup disabled: Restock history will be retained.'
      );
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err) {
      console.error('Failed to save setting:', err);
      setAutoCleanup(!nextVal); // revert
      alert('Failed to update setting.');
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerNow = async () => {
    if (!isAdmin) {
      alert('Admin access required.');
      return;
    }
    setTriggering(true);
    try {
      const res = await api.post('/settings/trigger-auto-cleanup', {});
      setToastMessage(res?.message || 'Auto-cleanup executed successfully.');
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err) {
      console.error('Failed to trigger auto-cleanup:', err);
      alert('Failed to trigger auto-cleanup.');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings size={26} color="var(--accent-color)" /> System Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Configure system automated tasks, retention policies, and application preferences.
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <Database size={20} color="var(--accent-color)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Restock & Purchase History Cleanup</h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Manage retention policies and automated log pruning for inventory purchase batches.
            </p>
          </div>
        </div>

        {/* Setting Item */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem',
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          marginBottom: '1rem'
        }}>
          <div style={{ paddingRight: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Clock size={18} color="var(--accent-color)" />
              <label style={{ fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }} onClick={handleToggleAutoCleanup}>
                Auto-delete restock history older than 30 days
              </label>
              <span className={`badge ${autoCleanup ? 'success' : 'secondary'}`} style={{ fontSize: '0.7rem' }}>
                {autoCleanup ? 'Enabled' : 'Disabled (Default OFF)'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              When enabled, restock and purchase records older than 30 days are automatically cleared on server startup and once daily via a background scheduled worker.
            </p>
          </div>

          {/* Toggle Switch */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleToggleAutoCleanup}
              disabled={loading || saving || !isAdmin}
              title={!isAdmin ? "Admin access required" : (autoCleanup ? "Click to disable auto-cleanup" : "Click to enable auto-cleanup")}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '9999px',
                border: 'none',
                background: autoCleanup ? 'var(--accent-color, #10b981)' : '#9ca3af',
                position: 'relative',
                cursor: (!isAdmin || loading || saving) ? 'not-allowed' : 'pointer',
                transition: 'background 0.25s ease',
                padding: '2px',
                outline: 'none',
                opacity: !isAdmin ? 0.6 : 1
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transform: autoCleanup ? 'translateX(24px)' : 'translateX(0px)',
                transition: 'transform 0.25s ease'
              }} />
            </button>
          </div>
        </div>

        {/* Data Safety Box */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <ShieldCheck size={22} color="var(--accent-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--accent-color)', marginBottom: '0.2rem' }}>
              Data Safety Guarantee
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
              Clearing history logs will <strong>NEVER</strong> modify current warehouse stock quantities, product catalog base costs, supplier profiles, or recent transactions on the Dashboard. Only the restock audit trail is safely pruned.
            </div>
          </div>
        </div>

        {/* Manual Trigger Option */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Schedule: Runs automatically every 24 hours and at application startup when enabled.
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleTriggerNow}
            disabled={triggering || !isAdmin}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', padding: '0.45rem 0.9rem' }}
          >
            <RefreshCw size={14} className={triggering ? 'spin' : ''} />
            {triggering ? 'Running Cleanup...' : 'Run Cleanup Now'}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          background: '#065F46',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <Check size={18} color="#A7F3D0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage('')}
            style={{ background: 'none', border: 'none', color: '#A7F3D0', cursor: 'pointer', marginLeft: '0.5rem', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

    </div>
  );
}
