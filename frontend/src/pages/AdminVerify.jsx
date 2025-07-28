import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AdminVerify() {
  const [reqs, setReqs]     = useState([]);
  const [err, setErr]       = useState('');
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    api.get('/api/admin/kyc')
      .then(res => setReqs(res.data))
      .catch(() => setErr('Could not load KYC requests'))
      .finally(() => setLoad(false));
  }, []);

  const decide = async (id, status) => {
    try {
      await api.patch(`/api/admin/kyc/${id}`, { status });
      setReqs(r => r.filter(x => x.id !== id));
    } catch {
      alert('Failed to update');
    }
  };

  if (loading) return <p>Loading KYC…</p>;
  if (err)     return <p style={{ color:'red' }}>{err}</p>;

  return (
    <table style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead>
        <tr><th>ID</th><th>Name</th><th>Civil</th><th>Company</th><th>Action</th></tr>
      </thead>
      <tbody>
        {reqs.map(r => (
          <tr key={r.id}>
            <td>{r.id}</td>
            <td>{r.name}</td>
            <td>{r.civil_id}</td>
            <td>{r.company_name}</td>
            <td>
              <button onClick={()=>decide(r.id,'verified')}>✔</button>
              <button onClick={()=>decide(r.id,'rejected')}>✖</button>
            </td>
          </tr>
        ))}
        {reqs.length===0 && (
          <tr><td colSpan="5" style={{ textAlign:'center' }}>No pending KYC</td></tr>
        )}
      </tbody>
    </table>
  );
}