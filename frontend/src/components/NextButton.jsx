// frontend/src/components/NextButton.jsx

import React from "react";

export default function NextButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        marginLeft: "1rem",
        padding: "0.5em 1em",
        background: "#0066FF",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      Next
    </button>
  );
}