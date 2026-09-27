import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { X, Pencil, AlertTriangle, ArrowRight, User, Check, RefreshCw, Info } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

export default function EditCollectionModal({
  isOpen,
  collection,
  hawkers = [],
  onClose,
  onSuccess
}) {
  const [formData, setFormData] = useState({
    date: '',
    hawker_id: '',
    amount: '',
    payment_method: 'Cash',
    edit_reason: ''
  });
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (collection) {
      setFormData({
        date: collection.date || new Date().toISOString().split('T')[0],
        hawker_id: collection.hawker_id || '',
        amount: collection.amount !== undefined ? String(collection.amount) : '',
        payment_method: collection.payment_method || 'Cash',
        edit_reason: collection.edit_reason || ''
      });
      setIsConfirming(false);
      setErrorMsg('');
    }
  }, [collection]);

  if (!isOpen || !collection) return null;

  const origAmount = parseFloat(collection.amount) || 0;
  const origHawkerId = collection.hawker_id;
  const newAmount = parseFloat(formData.amount) || 0;
  const newHawkerId = parseInt(formData.hawker_id) || null;

  const isAmountChanged = Math.abs(newAmount - origAmount) > 0.001;
  const isHawkerChanged = newHawkerId !== origHawkerId;
  const hasFinancialImpact = isAmountChanged || isHawkerChanged;

  const currentHawker = hawkers.find(h => h.id === origHawkerId);
  const selectedHawker = hawkers.find(h => h.id === newHawkerId);

  // Financial impact calculations
  const calculateBalanceImpact = () => {
    if (!isHawkerChanged) {
      const curBal = currentHawker ? currentHawker.balance : 0;
      const diff = newAmount - origAmount;
      const projBal = curBal + diff;
      return {
        type: 'same_hawker',
        hawkerName: currentHawker?.name || `Hawker #${origHawkerId}`,
        diff,
        curBal,
        projBal
      };
    } else {
      const oldCurBal = currentHawker ? currentHawker.balance : 0;
      const oldProjBal = oldCurBal - origAmount; // Reversing old payment

      const newCurBal = selectedHawker ? selectedHawker.balance : 0;
      const newProjBal = newCurBal + newAmount; // Applying new payment

      return {
        type: 'diff_hawkers',
        oldHawkerName: currentHawker?.name || `Hawker #${origHawkerId}`,
        oldCurBal,
        oldProjBal,
        newHawkerName: selectedHawker?.name || `Hawker #${newHawkerId}`,
        newCurBal,
        newProjBal
      };
    }
  };

  const impact = calculateBalanceImpact();

  const formatBalanceText = (bal) => {
    if (bal < 0) return <span className="text-danger" style={{ fontWeight: 700 }}>Owes ₹{Math.abs(bal).toFixed(2)}</span>;
    if (bal > 0) return <span className="text-success" style={{ fontWeight: 700 }}>Credit ₹{bal.toFixed(2)}</span>;
    return <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Settled (₹0.00)</span>;
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.hawker_id) {
      setErrorMsg('Please select a valid hawker.');
      return;
    }
    if (!newAmount || newAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than zero.');
      return;
    }
    if (!formData.payment_method) {
      setErrorMsg('Please select a payment method.');
      return;
    }

    // If financial fields changed, require explicit confirmation step
    if (hasFinancialImpact) {
      setIsConfirming(true);
    } else {
      // Date, method, or reason only changed -> proceed directly
      executeSave();
    }
  };

  const executeSave = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        date: formData.date,
        hawker_id: newHawkerId,
        amount: newAmount,
        payment_method: formData.payment_method,
        edit_reason: formData.edit_reason.trim() || `Edited from ₹${origAmount.toFixed(2)} to ₹${newAmount.toFixed(2)}`
      };

      const updated = await api.put(`/collections/${collection.id}`, payload);
      setIsSubmitting(false);
      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update collection:', err);
      setIsSubmitting(false);
      setErrorMsg('Failed to update payment record. Please check server connection.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 35, 32, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem'
    }}>
      <div className="card" style={{
        maxWidth: '560px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                background: 'var(--accent-pill)',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)'
              }}>
                <Pencil size={18} />
              </div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                {isConfirming ? 'Confirm Balance Adjustment' : 'Edit Recorded Payment'}
              </h2>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Transaction Ref: <strong>#COL-{collection.id}</strong> • Recorded Date: {collection.date}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            background: 'var(--danger-bg)',
            color: 'var(--danger-color)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={16} />
            {errorMsg}
          </div>
        )}

        {/* STEP 1: EDIT FORM */}
        {!isConfirming ? (
          <form onSubmit={handleInitialSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Date of Collection *
                </label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Hawker (Searchable) *
                </label>
                <SearchableSelect
                  options={hawkers.map(h => ({
                    value: h.id,
                    label: h.name,
                    sublabel: h.balance < 0 ? `Owes ₹${Math.abs(h.balance).toFixed(2)}` : (h.balance > 0 ? `Credit ₹${h.balance.toFixed(2)}` : 'Settled')
                  }))}
                  value={formData.hawker_id}
                  onChange={val => setFormData({ ...formData, hawker_id: val ? parseInt(val) : '' })}
                  placeholder="Select hawker..."
                  required
                  icon={User}
                />
              </div>

              <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Amount Collected (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                  {isAmountChanged && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                      Original was: <strong>₹{origAmount.toFixed(2)}</strong> ({newAmount - origAmount >= 0 ? '+' : ''}₹{(newAmount - origAmount).toFixed(2)})
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Payment Method *
                  </label>
                  <select
                    required
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Reason for Edit / Audit Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corrected cash count typo, swapped hawker"
                  value={formData.edit_reason}
                  onChange={e => setFormData({ ...formData, edit_reason: e.target.value })}
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                  This will be saved to the audit log for administrative accountability.
                </span>
              </div>

              {/* LIVE FINANCIAL IMPACT BANNER */}
              {hasFinancialImpact && (
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  marginTop: '0.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    <Info size={16} color="var(--mint-cyan)" /> Projected Balance Impact:
                  </div>

                  {impact.type === 'same_hawker' ? (
                    <div style={{ fontSize: '0.825rem', marginTop: '0.4rem', color: 'var(--text-primary)' }}>
                      Hawker <strong>{impact.hawkerName}</strong>'s balance will adjust by{' '}
                      <strong>{impact.diff >= 0 ? '+' : ''}₹{impact.diff.toFixed(2)}</strong>:<br />
                      <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <span>Current: {formatBalanceText(impact.curBal)}</span>
                        <ArrowRight size={14} color="var(--text-secondary)" />
                        <span>New: {formatBalanceText(impact.projBal)}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.825rem', marginTop: '0.4rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div>
                        • <strong>{impact.oldHawkerName}</strong> (reverting ₹{origAmount.toFixed(2)}):{' '}
                        {formatBalanceText(impact.oldCurBal)} ➔ {formatBalanceText(impact.oldProjBal)}
                      </div>
                      <div>
                        • <strong>{impact.newHawkerName}</strong> (applying ₹{newAmount.toFixed(2)}):{' '}
                        {formatBalanceText(impact.newCurBal)} ➔ {formatBalanceText(impact.newProjBal)}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={isSubmitting}
              >
                {hasFinancialImpact ? 'Review Balance Changes' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: CONFIRMATION VIEW */
          <div>
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B45309', fontWeight: 800, fontSize: '0.95rem' }}>
                <AlertTriangle size={18} />
                Confirm Financial Ledger Update
              </div>
              <p style={{ fontSize: '0.85rem', color: '#78350F', margin: '0.4rem 0 0 0', lineHeight: 1.4 }}>
                This edit directly alters cash collections and financial account balances. Please confirm the resulting balance changes before saving.
              </p>
            </div>

            <div style={{
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Financial Adjustments Summary
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Payment Amount:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)' }}>₹{origAmount.toFixed(2)}</span>
                    <ArrowRight size={14} />
                    <span className="text-success">₹{newAmount.toFixed(2)}</span>
                  </div>
                </div>

                {impact.type === 'same_hawker' ? (
                  <div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Affected Hawker: <strong>{impact.hawkerName}</strong>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FFFFFF',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Balance Before</div>
                        <div>{formatBalanceText(impact.curBal)}</div>
                      </div>
                      <ArrowRight size={16} color="var(--accent-color)" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Adjustment</div>
                        <div style={{ fontWeight: 700, color: impact.diff >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                          {impact.diff >= 0 ? '+' : ''}₹{impact.diff.toFixed(2)}
                        </div>
                      </div>
                      <ArrowRight size={16} color="var(--accent-color)" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Balance After</div>
                        <div>{formatBalanceText(impact.projBal)}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{
                      background: '#FFFFFF',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        Reversing from {impact.oldHawkerName}:
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span>Prior: {formatBalanceText(impact.oldCurBal)}</span>
                        <span>➔</span>
                        <span>New: {formatBalanceText(impact.oldProjBal)}</span>
                      </div>
                    </div>

                    <div style={{
                      background: '#FFFFFF',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        Applying to {impact.newHawkerName}:
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span>Prior: {formatBalanceText(impact.newCurBal)}</span>
                        <span>➔</span>
                        <span>New: {formatBalanceText(impact.newProjBal)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Method: <strong>{formData.payment_method}</strong> | Date: <strong>{formData.date}</strong>
                  {formData.edit_reason && <> | Note: <em>"{formData.edit_reason}"</em></>}
                </div>
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsConfirming(false)}
                disabled={isSubmitting}
              >
                Back to Edit
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={executeSave}
                disabled={isSubmitting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Updating Balances...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Confirm & Update Balances
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
