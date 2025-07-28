import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Typography
} from '@mui/material';
import api from '../api';

export default function AdvertiserProfile() {
  const [form, setForm] = useState({
    name: '',
    civil_id: '',
    phone: '',
    company_name: '',
    license_number: '',
    signatory_name: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/advertiser/profile')
      .then(res => setForm(res.data))
      .catch(console.error);
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    await api.put('/advertiser/profile', data);
    setMessage('Profile updated.');
  };

  return (
    <Box p={2} maxWidth={600} mx="auto">
      <Typography variant="h5" mb={2}>Business Profile</Typography>

      {['name','civil_id','phone','company_name','license_number','signatory_name']
        .map(key => (
          <TextField
            key={key}
            fullWidth
            name={key}
            label={key.replace('_',' ')}
            value={form[key]}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
      ))}

      <Box my={2}>
        <Button variant="contained" component="label" sx={{ mr:2 }}>
          Re-upload License Doc
          <input type="file" name="license_doc" hidden />
        </Button>
      </Box>

      <Button variant="contained" onClick={handleSubmit}>Save Profile</Button>
      {message && <Typography mt={2}>{message}</Typography>}
    </Box>
  );
}