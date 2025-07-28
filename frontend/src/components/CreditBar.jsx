import React, { useContext }           from "react";
import { CreditContext }               from "../contexts/CreditContext";

export default function CreditBar() {
  const { credit } = useContext(CreditContext);
  return (
    <div style={{ position: 'fixed', top: 16, right: 16 }}>
      Balance: {credit.toFixed(3)} KWD
    </div>
  );
}