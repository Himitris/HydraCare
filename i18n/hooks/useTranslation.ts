import { useCallback } from 'react';
import { i18n } from '../index';
import { useAppContext } from '@/context/AppContext';

export function useTranslation() {
  const { settings } = useAppContext();

  const t = useCallback(
    (key: string) => {
      return i18n.t(key);
    },
    [settings.language]
  ); // Add language as dependency

  return { t, i18n };
}