import React, { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, TextField, Typography
} from '@mui/material';
import { AD_PACKAGES } from '../constants/advertiser';
import api from '../api';

export default function AdvertiserPackages() {
  const [credit, setCredit] = useState(0);
  const [amount, setAmount] = useState(300);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // load current wallet
    api.get('/advertiser/credit').then(res => setCredit(res.data.balance));
  }, []);

  const handleBuy = async pkg => {
    if (amount < pkg.baseBudget) {
      return setMsg(`Minimum for this package is ${pkg.baseBudget} KD.`);
    }
    try {
      await api.post('/advertiser/packages/buy', {
        package_id: pkg.id,
        amount
      });
      setCredit(prev => prev - amount);
      setMsg(`Bought ${pkg.label} for ${amount} KD.`);
    } catch (err) {
      console.error(err);
      setMsg('Purchase failed.');
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Buy Ad Package</Typography>
      <Typography mb={2}>Your Credit: {credit} KD</Typography>

      <TextField
        type="number"
        label="Amount (KD)"
        value={amount}
        onChange={e => setAmount(+e.target.value)}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={2}>
        {AD_PACKAGES.map(pkg => (
          <Grid item xs={12} md={6} key={pkg.id}>
            <Card>
              <CardContent>
                <Typography>{pkg.label}</Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => handleBuy(pkg)}
                >
                  Buy
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {msg && <Typography mt={2}>{msg}</Typography>}
    </Box>
);
}