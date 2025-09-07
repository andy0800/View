import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

import api from '../api';

export default function WalletOverview() {
  const [balance, setBalance] = useState({ availableBalance: 0, heldBalance: 0 });
  const { t } = useTranslation();

  const fetch = async () => {
    const res = await api.get('/api/wallet');
    // Expect backend shape: { success, balance, heldBalance, availableBalance }
    setBalance({
      availableBalance: res.data.availableBalance ?? 0,
      heldBalance: res.data.heldBalance ?? 0
    });
  };

  useEffect(() => { fetch(); }, []);

  const redeem = async () => {
    const amount = parseInt(prompt(t('wallet.enterAmountToWithdraw')), 10);
    if (!isNaN(amount)) {
      await api.post('/api/wallet/redeem', { amount });
      fetch();
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
      <Typography>{t('wallet.available')}: {balance.availableBalance}</Typography>
      <Typography>{t('wallet.onHold')}: {balance.heldBalance}</Typography>
      <Button variant="outlined" onClick={redeem} sx={{ mt: 1 }}>
        {t('wallet.withdraw')}
      </Button>
    </Box>
  );
}