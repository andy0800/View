import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [err, setErr]       = useState('');
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    api.get('/api/admin/users')
      .then(res => setUsers(res.data))
      .catch(e => setErr(e.response?.data?.message || 'Could not load users.'))
      .finally(() => setLoad(false));
  }, []);

  if (loading) return <p>Loading users…</p>;
  if (err)     return <p style={{ color: 'red' }}>{err}</p>;

  return (
    <table style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead>
        <tr>
          <th>ID</th><th>Name</th><th>Phone</th>
          <th>Role</th><th>KYC Status</th><th>Joined</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id}>
            <td>{u.id}</td>
            <td>{u.name}</td>
            <td>{u.phone}</td>
            <td>{u.role}</td>
            <td>{u.kyc_status}</td>
            <td>{new Date(u.created_at).toLocaleString()}</td>
          </tr>
        ))}
        {users.length===0 && (
          <tr><td colSpan="6" style={{ textAlign:'center' }}>No users</td></tr>
        )}
      </tbody>
    </table>
  );
}