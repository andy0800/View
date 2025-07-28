// frontend/src/components/SectionCard.jsx

import React from "react";

export default function SectionCard({ section, onClick }) {
  return (
    <div
      onClick={() => onClick(section.id)}
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "1rem",
        cursor: "pointer",
        textAlign: "center",
        width: 200,
        margin: "0.5rem"
      }}
    >
      <h3 style={{ margin: "0 0 0.5rem" }}>{section.title}</h3>
      {section.thumbnailUrl && (
        <img
          src={section.thumbnailUrl}
          alt={section.title}
          style={{ maxWidth: "100%", borderRadius: 4 }}
        />
      )}
    </div>
  );
}