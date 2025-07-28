import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AdminWithdrawals() {
  const [wds, setWds]       = useState([]);
  const [err, setErr]       = useState('');
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    api.get('/api/admin/withdrawals')
      .then(res => setWds(res.data))
      .catch(() => setErr('Could not load withdrawals'))
      .finally(() => setLoad(false));
  }, []);

  const decide = async (id, approved) => {
    try {
      await api.patch(`/api/admin/withdrawals/${id}`, { approved });
      setWds(w => w.filter(x => x.id !== id));
    } catch {
      alert('Failed to update withdrawal');
    }
  };

  if (loading) return <p>Loading withdrawals…</p>;
  if (err)     return <p style={{ color:'red' }}>{err}</p>;

  return (
    <table style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead>
        <tr><th>ID</th><th>User</th><th>Amount</th><th>Action</th></tr>
      </thead>
      <tbody>
        {wds.map(w => (
          <tr key={w.id}>
            <td>{w.id}</td>
            <td>{w.user.name}</td>
            <td>{w.amount}</td>
            <td>
              <button onClick={()=>decide(w.id,true)}>Approve</button>
              <button onClick={()=>decide(w.id,false)}>Reject</button>
            </td>
          </tr>
        ))}
        {wds.length===0 && (
          <tr><td colSpan="4" style={{ textAlign:'center' }}>No withdrawals</td></tr>
        )}
      </tbody>
    </table>
  );
}