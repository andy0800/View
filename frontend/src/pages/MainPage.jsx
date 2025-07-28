import React, { useEffect, useState } from 'react';
import { getSections }     from '../api/viewer';
import SectionCard from "../components/SectionCard";
export default function MainPage() {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    getSections()
      .then(setSections)
      .catch(err => console.error('Failed to load sections', err));
  }, []);

  return (
    <div className="grid">
      {sections.map(section => (
        <SectionCard key={section.id} section={section} />
      ))}
    </div>
  );
}