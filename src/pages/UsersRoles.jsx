import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { UserCheck, Shield, Plus, Edit, Trash2, Search, Mail, Key, Check, X } from 'lucide-react';

export default function UsersRoles() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Store Manager',
    status: true,
    notes: ''
  });

  const fetchUsers = async () => {
    try {
      const data = await api.get('/users/');
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/', newUser);
      setShowForm(false);
      setNewUser({ name: '', email: '', role: 'Store Manager', status: true, notes: '' });
      fetchUsers();
      alert('User created successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to create user');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.put(`/users/${editingUser.id}`, editingUser);
      setEditingUser(null);
      fetchUsers();
      alert('User updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to update user');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user account?")) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (e) {
        console.error(e);
        alert('Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Roles Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            System user accounts, role definitions, and access permissions.
          </p>
        </div>
        <button className="btn" onClick={() => { setShowForm(!showForm); setEditingUser(null); }}>
          <Plus size={18} /> Add New User
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)' }}>
          <h3>Create System User Account</h3>
          <form onSubmit={handleCreate} className="mt-4">
            <div className="grid-cols-3" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>User Name *</label>
                <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. Sarah Jenkins" />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="sarah@example.com" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="Admin">Admin (Full Control)</option>
                  <option value="Store Manager">Store Manager (Inventory & Restocks)</option>
                  <option value="Dispatcher">Dispatcher (Morning Distribution)</option>
                  <option value="Accountant">Accountant (Collections & Expenses)</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" id="user-status" checked={newUser.status} onChange={e => setNewUser({...newUser, status: e.target.checked})} style={{ width: 'auto' }} />
              <label htmlFor="user-status" style={{ margin: 0 }}>Active Account</label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success">Save User Account</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)' }}>
          <h3>Edit User Account (#{editingUser.id})</h3>
          <form onSubmit={handleUpdate} className="mt-4">
            <div className="grid-cols-3" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>User Name *</label>
                <input required type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input required type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                  <option value="Admin">Admin (Full Control)</option>
                  <option value="Store Manager">Store Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Accountant">Accountant</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" id="edit-user-status" checked={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.checked})} style={{ width: 'auto' }} />
              <label htmlFor="edit-user-status" style={{ margin: 0 }}>Active Account</label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success"><Check size={16}/> Save Changes</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}><X size={16}/> Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="filters-panel">
          <div className="topbar-search" style={{ margin: 0, width: '100%', maxWidth: '400px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search users by name, email, or role..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={14} color="var(--info-color)" /> {u.email}
                    </span>
                  </td>
                  <td>
                    <span className="badge info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={12} /> {u.role}
                    </span>
                  </td>
                  <td>
                    {u.status ? (
                      <span className="badge success">Active</span>
                    ) : (
                      <span className="badge danger">Disabled</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem', marginRight: '0.5rem' }} title="Edit" onClick={() => setEditingUser(u)}>
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger-color)' }} title="Delete" onClick={() => handleDelete(u.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                    No user accounts found. Click "Add New User" to register a user.
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
