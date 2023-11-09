import React from 'react';
import { useState } from 'react';
import { InputLabel } from '@mui/material';

interface RatingProps {
  id?: string;
  value: number;
  updateValue: (newValue: number) => void;
  maxVal?: number;
}

export const Rating: React.FC<RatingProps> = ({ id, value, updateValue, maxVal }) => {
  const [hoverAt, setHoverAt] = useState<number | null>(null);

  return (
    <div id='#/properties/rating' className='rating'>
      <InputLabel shrink style={{ marginTop: '0.8em' }}>Rating</InputLabel>
      <div style={{ cursor: 'pointer', fontSize: '18px' }}>
        {Array.from(Array(maxVal ?? 5).keys()).map((i) => {
          const fullStars = hoverAt ?? value;

          return (
            <span
              onMouseOver={() => setHoverAt(i + 1)}
              onMouseOut={() => setHoverAt(null)}
              onClick={() => updateValue(i + 1)}
              key={`${id}_${i}`}
            >
              {i < fullStars ? '\u2605' : '\u2606'}
            </span>
          );
        })}
      </div>
    </div>
  );
};