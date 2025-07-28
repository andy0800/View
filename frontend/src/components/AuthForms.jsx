// frontend/src/components/AuthForms.jsx

import React, { useState } from 'react';
import api               from '../api';           // your axios instance
import { useAuth }       from '../contexts/AuthContext';
import { useNavigate }   from 'react-router-dom';

export default function AuthForms() {
  const { persist }   = useAuth();
  const navigate      = useNavigate();
  const [tab, setTab] = useState('login'); // 'login', 'viewer', 'advertiser'

  // Shared state
  const [phone, setPhone]       = useState('');
  const [code, setCode]         = useState('');
  const [step, setStep]         = useState('request'); 
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Viewer sign-up
  const [vName, setVName]         = useState('');
  const [vCivilId, setVCivilId]   = useState('');
  const [civilFront, setCivilFront] = useState(null);
  const [civilBack, setCivilBack]   = useState(null);

  // Advertiser sign-up
  const [aName, setAName]             = useState('');
  const [aCivilId, setACivilId]       = useState('');
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [signatoryName, setSignatoryName] = useState('');
  const [licenseDoc, setLicenseDoc]       = useState(null);

  // 1) Handle OTP login
  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (step === 'request') {
        await api.post('/auth/request-otp', { phone });
        setStep('verify');
      } else {
        const { data } = await api.post('/auth/verify-otp', { phone, code });
        persist(data.user);       // store only user in localStorage
        // redirect based on role
        if (data.user.role === 'viewer') {
          navigate('/viewer', { replace: true });
        } else {
          navigate('/advertiser', { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // 2) Viewer registration
  const handleViewerSignUp = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = new FormData();
      form.append('name', vName);
      form.append('civil_id', vCivilId);
      form.append('phone', phone);
      form.append('civil_front', civilFront);
      form.append('civil_back', civilBack);

     await api.post('/auth/register-viewer', form);
      alert('Registered! OTP sent to your phone.');
      setTab('login');
      setStep('request');
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  // 3) Advertiser registration
  const handleAdvertiserSignUp = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = new FormData();
      form.append('name',           aName);
      form.append('civil_id',       aCivilId);
      form.append('phone',          phone);
      form.append('company_name',   companyName);
      form.append('license_number', licenseNumber);
      form.append('signatory_name', signatoryName);
      form.append('license_doc',    licenseDoc);

      await api.post('/auth/register-advertiser', form);
      alert('Registered! Awaiting KYC. You can log in anytime.');
      setTab('login');
      setStep('request');
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h1>AdRewards</h1>
      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 20 }}>
        {['login','viewer','advertiser'].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); setStep('request'); }}
            style={{
              flex: 1,
              padding: 8,
              background: tab===t ? '#333' : '#eee',
              color:     tab===t ? '#fff' : '#000',
              border: 'none'
            }}
          >
            {t === 'login'
              ? 'Login'
              : t === 'viewer'
                ? 'Viewer Sign-Up'
                : 'Advertiser Sign-Up'}
          </button>
        ))}
      </div>

      {/* Login Form */}
      {tab === 'login' && (
        <form onSubmit={handleLogin} style={{ display: 'grid', gap: 12 }}>
          <input
            type="tel" placeholder="Phone"
            value={phone} onChange={e => setPhone(e.target.value)}
            required
          />
          {step === 'verify' && (
            <input
              type="text" placeholder="OTP Code"
              value={code} onChange={e => setCode(e.target.value)}
              required
            />
          )}
          <button disabled={loading} type="submit">
            {step === 'request' ? 'Send OTP' : 'Verify & Login'}
          </button>
          {step === 'verify' && (
            <button
              type="button"
              onClick={()=> setStep('request')}
              style={{ background: 'transparent', color: '#007bff', border: 'none' }}
            >
              Back
            </button>
          )}
        </form>
      )}

      {/* Viewer Sign-Up */}
      {tab === 'viewer' && (
        <form onSubmit={handleViewerSignUp} style={{ display: 'grid', gap: 12 }}>
          <input
            type="text" placeholder="Full Name"
            value={vName} onChange={e=>setVName(e.target.value)}
            required
          />
          <input
            type="text" placeholder="Civil ID"
            value={vCivilId} onChange={e=>setVCivilId(e.target.value)}
            required
          />
          <input
            type="tel" placeholder="Phone"
            value={phone} onChange={e=>setPhone(e.target.value)}
            required
          />
          <label>
            Civil Front:
            <input
              type="file" accept="image/*"
              onChange={e=>setCivilFront(e.target.files[0])}
              required
            />
          </label>
          <label>
            Civil Back:
            <input
              type="file" accept="image/*"
              onChange={e=>setCivilBack(e.target.files[0])}
              required
            />
          </label>
          <button disabled={loading} type="submit">Register Viewer</button>
        </form>
      )}

      {/* Advertiser Sign-Up */}
      {tab === 'advertiser' && (
        <form onSubmit={handleAdvertiserSignUp} style={{ display: 'grid', gap: 12 }}>
          <input
            type="text" placeholder="Full Name"
            value={aName} onChange={e=>setAName(e.target.value)}
            required
          />
          <input
            type="text" placeholder="Civil ID"
            value={aCivilId} onChange={e=>setACivilId(e.target.value)}
            required
          />
          <input
            type="tel" placeholder="Phone"
            value={phone} onChange={e=>setPhone(e.target.value)}
            required
          />
          <input
            type="text" placeholder="Company Name"
            value={companyName}
            onChange={e=>setCompanyName(e.target.value)}
            required
          />
          <input
            type="text" placeholder="License Number"
            value={licenseNumber}
            onChange={e=>setLicenseNumber(e.target.value)}
            required
          />
          <input
            type="text" placeholder="Signatory Name"
            value={signatoryName}
            onChange={e=>setSignatoryName(e.target.value)}
            required
          />
          <label>
            License Document:
            <input
              type="file" accept="application/pdf,image/*"
              onChange={e=>setLicenseDoc(e.target.files[0])}
              required
            />
          </label>
          <button disabled={loading} type="submit">Register Advertiser</button>
        </form>
      )}

      {error && <p style={{ color:'red', marginTop:12 }}>{error}</p>}
    </div>
  );
}