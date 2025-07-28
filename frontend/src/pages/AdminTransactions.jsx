import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AdminTransactions() {
  const [tx, setTx]         = useState([]);
  const [err, setErr]       = useState('');
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    api.get('/api/admin/transactions')
      .then(res => setTx(res.data))
      .catch(() => setErr('Could not load transactions'))
      .finally(() => setLoad(false));
  }, []);

  if (loading) return <p>Loading transactions…</p>;
  if (err)     return <p style={{ color:'red' }}>{err}</p>;

  return (
    <table style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead>
        <tr><th>ID</th><th>User</th><th>Type</th><th>Amount</th><th>Date</th></tr>
      </thead>
      <tbody>
        {tx.map(t => (
          <tr key={t.id}>
            <td>{t.id}</td>
            <td>{t.user.name}</td>
            <td>{t.type}</td>
            <td>{t.amount_pts}</td>
            <td>{new Date(t.created_at).toLocaleString()}</td>
          </tr>
        ))}
        {tx.length===0 && (
          <tr><td colSpan="5" style={{ textAlign:'center' }}>No transactions</td></tr>
        )}
      </tbody>
    </table>
  );
}