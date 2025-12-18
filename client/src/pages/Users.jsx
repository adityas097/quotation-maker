import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';
import { API_BASE_URL } from '../apiConfig';
import { Plus, Trash2, Shield, ShieldOff, UserCheck, UserX } from 'lucide-react';
import Modal from '../components/Modal';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await authFetch(`${API_BASE_URL}/api/users`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                console.error("Failed to fetch users");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const res = await authFetch(`${API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (res.ok) {
                setIsAddModalOpen(false);
                setNewUser({ username: '', password: '', role: 'user' });
                fetchUsers();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create user');
            }
        } catch (err) {
            console.error(err);
            alert('Error creating user');
        }
    };

    const toggleStatus = async (user) => {
        const newStatus = user.status === 'active' ? 'disabled' : 'active';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'enable' : 'disable'} ${user.username}?`)) return;

        try {
            const res = await authFetch(`${API_BASE_URL}/api/users/${user.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchUsers();
            else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Permanently delete this user?')) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) fetchUsers();
            else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="card">
            <div className="flex-between mb-6">
                <h2>User Management</h2>
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={16} /> Add User
                </button>
            </div>

            <div className="table-container">
                {loading ? <p>Loading users...</p> : (
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: 500 }}>{u.username}</td>
                                    <td>
                                        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ backgroundColor: u.status === 'active' ? '#dcfce7' : '#fee2e2', color: u.status === 'active' ? '#166534' : '#991b1b' }}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button
                                                className="btn btn-secondary p-2"
                                                onClick={() => toggleStatus(u)}
                                                title={u.status === 'active' ? "Disable Account" : "Enable Account"}
                                            >
                                                {u.status === 'active' ? <UserDataIcon status="active" /> : <UserDataIcon status="disabled" />}
                                            </button>
                                            <button className="btn btn-danger p-2" onClick={() => handleDelete(u.id)} title="Delete User">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New User">
                <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username / Email</label>
                        <input className="input" required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                        <input className="input" type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Role</label>
                        <select className="input" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                            <option value="user">Standard User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create User</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const UserDataIcon = ({ status }) => {
    if (status === 'active') return <ShieldOff size={16} color="#ef4444" />; // Icon to disable
    return <Shield size={16} color="#10b981" />; // Icon to enable
};

export default Users;
