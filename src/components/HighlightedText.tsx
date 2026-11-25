import React from 'react';
import { getHighlightSegments } from '../utils/wnioskiSearch';

interface HighlightedTextProps {
  text: string;
  terms: string[];
  ignoreDiacritics?: boolean;
  active?: boolean;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  terms,
  ignoreDiacritics = true,
  active = true,
}) => {
  if (!active || terms.length === 0) {
    return <>{text}</>;
  }

  const segments = getHighlightSegments(text, terms, ignoreDiacritics);
  return (
    <>
      {segments.map((seg, idx) =>
        seg.matched ? (
          <mark
            key={idx}
            className="rounded-xs bg-amber-200/80 px-0.5 font-medium text-slate-950"
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={idx}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
};
