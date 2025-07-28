import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Select, MenuItem, Modal } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';
import api from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function AdvertiserDashboard() {
  // existing state...
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [clientSecret, setClientSecret] = useState('');

  // existing fetchPackages, fetchCredit...

  // 1. Create PaymentIntent
  const handleDeposit = async () => {
    const { data } = await api.post('/api/payment/create-intent', { amountKD: depositAmount });
    setClientSecret(data.clientSecret);
    setShowDeposit(true);
  };

  // 2. Modal with Stripe Elements
  const appearance = { theme: 'stripe' };
  const options = { clientSecret, appearance };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p:2 }}>
      {/* existing UI... */}

      <Typography sx={{ mt:4, mb:1 }}>Deposit Credit</Typography>
      <TextField
        type="number"
        label="Amount (KD)"
        value={depositAmount}
        onChange={e => setDepositAmount(e.target.value)}
        sx={{ mb:2 }}
        fullWidth
      />
      <Button
        variant="contained"
        fullWidth
        onClick={handleDeposit}
      >
        Continue to Payment
      </Button>

      <Modal open={showDeposit} onClose={() => setShowDeposit(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', bg: 'white',
          p:4, borderRadius:2, boxShadow:24, width:400
        }}>
          {clientSecret && (
            <Elements stripe={stripePromise} options={options}>
              <PaymentElement onChange={() => {}} />
              <Button
                variant="contained"
                fullWidth
                onClick={async () => {
                  const { error } = await stripePromise.confirmPayment({
                    elements: stripePromise.elements(),
                    confirmParams: { return_url: window.location.href }
                  });
                  if (error) alert(error.message);
                  else {
                    setShowDeposit(false);
                    fetchCredit();
                  }
                }}
                sx={{ mt:2 }}
              >
                Pay {depositAmount} KD
              </Button>
            </Elements>
          )}
        </Box>
      </Modal>
    </Box>
  );
}