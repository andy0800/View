import React, { useContext }               from "react";
import { CreditContext }                   from "../contexts/CreditContext";
import { addCredits, getWalletBalance }    from "../api/viewer";
export default function CreditPage() {
  const { credit, setCredit } = useContext(CreditContext);
  const [amount, setAmount]    = useState('');

  const handleWithdraw = async () => {
    try {
      await withdrawCredit(amount);
      setCredit(prev => prev - Number(amount));
      setAmount('');
    } catch (err) {
      console.error('Withdrawal failed', err);
    }
  };

  return (
    <div>
      <h2>Your Balance: {credit.toFixed(3)} KWD</h2>
      <input
        type="number"
        step="0.001"
        min="0"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount to withdraw"
      />
      <button disabled={!amount} onClick={handleWithdraw}>
        Withdraw
      </button>
    </div>
  );
}