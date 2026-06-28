import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Receipt, Search } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Travel',
    amount: '',
    description: ''
  });

  const fetchExpenses = async () => {
    try {
      const data = await api.get('/expenses/');
      setExpenses(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses/', {
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      });
      setShowAddForm(false);
      setNewExpense({ ...newExpense, amount: '', description: '' });
      fetchExpenses();
      alert('Expense logged!');
    } catch (e) {
      console.error(e);
      alert('Failed to log expense');
    }
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Operational Expenses</h1>
        <button className="btn" onClick={() => setShowAddForm(!showAddForm)}>
          <Receipt size={18} /> Log New Expense
        </button>
      </div>

      <div className="grid-cols-3" style={{ display: 'grid', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-secondary)' }}>Total Expenses</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>₹{totalExpenses.toFixed(2)}</div>
        </div>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Log Operational Expense</h3>
          <form onSubmit={handleExpense} className="mt-4">
            <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Date</label>
                <input required type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                  <option>Travel / Fuel</option>
                  <option>Salary / Wages</option>
                  <option>Maintenance</option>
                  <option>Utilities</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input required type="number" step="0.01" min="0" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input required type="text" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="e.g. Fuel for delivery van" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success">Save Expense</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Expense History</h3>
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.slice().reverse().map(expense => (
                <tr key={expense.id}>
                  <td>{expense.date}</td>
                  <td><span className="badge info">{expense.category}</span></td>
                  <td>{expense.description}</td>
                  <td className="text-danger" style={{ fontWeight: 600 }}>-₹{expense.amount.toFixed(2)}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No expenses logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
