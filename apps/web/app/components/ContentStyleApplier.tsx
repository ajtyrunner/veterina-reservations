'use client';

import { useEffect } from 'react';
import { useContent, applyContentStyles } from '../../lib/content-context';

export function ContentStyleApplier() {
  const { colors } = useContent();

  useEffect(() => {
    if (colors) {
      applyContentStyles(colors);
    }
  }, [colors]);

  return null;
}