// src/components/Spinner/index.tsx
import React from "react";

interface SpinnerProps {
  size?: number; // size in rem
  color?: string; // Tailwind border color class
}

const Spinner: React.FC<SpinnerProps> = ({ size = 8, color = "border-brand-primary" }) => {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-t-transparent ${color}`}
      style={{ width: `${size}rem`, height: `${size}rem` }}
    />
  );
};

export default Spinner;