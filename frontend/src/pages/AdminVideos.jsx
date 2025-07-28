import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AdminVideos() {
  const [vds, setVds]      = useState([]);
  const [err, setErr]      = useState('');
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    api.get('/api/admin/videos')
      .then(res => setVds(res.data))
      .catch(() => setErr('Could not load videos'))
      .finally(() => setLoad(false));
  }, []);

  if (loading) return <p>Loading videos…</p>;
  if (err)     return <p style={{ color:'red' }}>{err}</p>;

  return (
    <table style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead>
        <tr><th>ID</th><th>URL</th><th>User</th><th>Package</th><th>Date</th></tr>
      </thead>
      <tbody>
        {vds.map(v => (
          <tr key={v.id}>
            <td>{v.id}</td>
            <td><a href={v.url} target="_blank" rel="noreferrer">View</a></td>
            <td>{v.user.name}</td>
            <td>{v.package.name}</td>
            <td>{new Date(v.created_at).toLocaleString()}</td>
          </tr>
        ))}
        {vds.length===0 && (
          <tr><td colSpan="5" style={{ textAlign:'center' }}>No videos</td></tr>
        )}
      </tbody>
    </table>
  );
}