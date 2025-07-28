import React, { useState } from 'react';
import {
  Box, Button, MenuItem, Select, TextField, Typography
} from '@mui/material';
import { AD_PACKAGES } from '../constants/advertiser';
import api from '../api';

export default function AdvertiserActivate() {
  const [media, setMedia] = useState(null);
  const [pkgId, setPkgId] = useState(1);
  const [budget, setBudget] = useState(AD_PACKAGES[0].baseBudget);
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const pkg = AD_PACKAGES.find(p => p.id === pkgId);

  const handleSubmit = async () => {
    if (!media) return setMessage('Please select a video file.');
    if (!title.trim()) return setMessage('Please enter an ad title.');
    const form = new FormData();
    form.append('media', media);
    form.append('package_id', pkgId);
    form.append('budget', budget);
    form.append('title', title);
    form.append('description', description);

    try {
      await api.post('/advertiser/ads', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Ad activated! Check your Published Ads page.');
    } catch (err) {
      console.error(err);
      setMessage('Failed to activate ad.');
    }
  };

  return (
    <Box p={2} maxWidth={600} mx="auto">
      <Typography variant="h5" mb={2}>Create & Activate Ad</Typography>
      <TextField
        fullWidth
        label="Ad Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />
 
      <TextField
        fullWidth
        label="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        sx={{ mb: 2 }}
      />


      <Select
        fullWidth
        value={pkgId}
        onChange={e => {
          const id = +e.target.value;
          setPkgId(id);
          setBudget(AD_PACKAGES.find(p => p.id === id).baseBudget);
        }}
        sx={{ mb: 2 }}
      >
        {AD_PACKAGES.map(p => (
          <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
        ))}
      </Select>

      <TextField
        type="number"
        label="Budget (KD)"
        fullWidth
        value={budget}
        onChange={e => setBudget(+e.target.value)}
        helperText={`Min ${pkg.baseBudget} KD, increments of 100`}
        sx={{ mb: 2 }}
      />

      <Button variant="contained" component="label" sx={{ mb: 2 }}>
        Upload Video
        <input
          type="file"
          accept="video/*"
          hidden
          onChange={e => setMedia(e.target.files[0])}
        />
      </Button>
      {media && <Typography>Selected: {media.name}</Typography>}

      <Box mt={3}>
        <Button variant="contained" onClick={handleSubmit}>
          Activate Ad
        </Button>
      </Box>

      {message && <Typography mt={2}>{message}</Typography>}
    </Box>
  );
}