import React, { useState, useEffect } from 'react';
import {
  Box, Button, Grid, TextField, Typography
} from '@mui/material';
import api from '../api';

export default function AdvertiserCredit() {
  const [balance, setBalance] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [withdraw, setWithdraw] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api.get('/advertiser/credit');
      setBalance(res.data.balance);
      setHistory(res.data.history || []);
    }
    load();
  }, []);

  const handleDeposit = async () => {
    await api.post('/advertiser/credit/deposit', { amount: deposit });
    setBalance(prev => prev + deposit);
  };

  const handleWithdraw = async () => {
    await api.post('/advertiser/credit/withdraw', { amount: withdraw });
    setBalance(prev => prev - withdraw);
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Credit Management</Typography>
      <Typography mb={2}>Balance: {balance} KD</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            type="number"
            label="Deposit (KD)"
            fullWidth
            value={deposit}
            onChange={e => setDeposit(+e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button variant="contained" onClick={handleDeposit}>Deposit</Button>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            type="number"
            label="Withdraw (KD)"
            fullWidth
            value={withdraw}
            onChange={e => setWithdraw(+e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button variant="contained" onClick={handleWithdraw}>Withdraw</Button>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h6">Transaction History</Typography>
        {history.map((h, i) => (
          <Typography key={i}>
            {h.type} {h.amount} KD on {new Date(h.date).toLocaleString()}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}