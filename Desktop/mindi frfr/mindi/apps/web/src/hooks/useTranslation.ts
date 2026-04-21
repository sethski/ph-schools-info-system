// =============================================================================
// MINDI — useTranslation Hook
// Provides t() for locale-aware string lookup.
// Falls back to English if key missing in target locale.
// =============================================================================

'use client';

import { useCallback } from 'react';
import { translations, type TranslationKey } from '../../../../shared/i18n/translations';

export function useTranslation(locale: string = 'en') {
  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string>): string => {
      const dict = translations[locale] ?? translations['en'];
      const fallback = translations['en'];
      let str = dict[key] ?? fallback[key] ?? key;

      // Variable interpolation: {varName}
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, v);
        }
      }

      return str;
    },
    [locale]
  );

  return { t };
}
