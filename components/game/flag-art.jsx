"use client";
import { useState } from "react";
import { flagSrc } from "./data";

export function FlagArt({ country, className = "", onLoad }) {
  return (
    <img
      className={`flag-art ${className}`}
      src={flagSrc(country.code)}
      alt={`${country.name} flag`}
      onLoad={onLoad}
    />
  );
}
export function FlagFrame({ country, className }) {
  const [ratio, setRatio] = useState(1.5);
  return (
    <div className={className} style={{ "--flag-ratio": ratio }}>
      <FlagArt
        country={country}
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalHeight > 0) setRatio(naturalWidth / naturalHeight);
        }}
      />
    </div>
  );
}
