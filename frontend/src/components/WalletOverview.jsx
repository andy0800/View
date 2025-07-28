import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import api from '../services/api';

export default function WalletOverview() {
  const [balance, setBalance] = useState({ confirmed: 0, pending: 0 });

  const fetch = async () => {
    const res = await api.get('/api/wallet/balance');
    setBalance(res.data);
  };

  useEffect(() => { fetch(); }, []);

  const redeem = async () => {
    const amount = parseInt(prompt('Amount (in fils)'), 10);
    if (!isNaN(amount)) {
      await api.post('/api/wallet/redeem', { amount });
      fetch();
    }
  };

  return (
    <Box sx={{ p:2, border: '1px solid #ddd', borderRadius:2 }}>
      <Typography>Confirmed Points: {balance.confirmed}</Typography>
      <Typography>Pending Points: {balance.pending}</Typography>
      <Button variant="outlined" onClick={redeem} sx={{ mt:1 }}>
        Withdraw
      </Button>
    </Box>
  );
}