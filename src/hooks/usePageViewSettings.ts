import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage page-level section visibility settings stored in localStorage.
 * Allows users to customize what cards and widgets appear on each page/tool.
 */
export function usePageViewSettings<T extends Record<string, boolean>>(
  pageKey: string,
  defaultSettings: T
) {
  const storageKey = `core_page_view_settings_${pageKey}_v1`;

  const [settings, setSettings] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults so newly introduced sections get default values
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.warn(`Failed reading view settings for page "${pageKey}":`, e);
    }
    return defaultSettings;
  });

  const saveSettings = useCallback(
    (newSettings: T) => {
      setSettings(newSettings);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newSettings));
      } catch (e) {
        console.warn(`Failed saving view settings for page "${pageKey}":`, e);
      }
    },
    [storageKey, pageKey]
  );

  const toggleSetting = useCallback(
    (key: keyof T) => {
      setSettings((prev) => {
        const updated = {
          ...prev,
          [key]: !prev[key],
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {
          console.warn(`Failed saving view settings for page "${pageKey}":`, e);
        }
        return updated;
      });
    },
    [storageKey, pageKey]
  );

  const setSetting = useCallback(
    (key: keyof T, val: boolean) => {
      setSettings((prev) => {
        const updated = {
          ...prev,
          [key]: val,
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {
          console.warn(`Failed saving view settings for page "${pageKey}":`, e);
        }
        return updated;
      });
    },
    [storageKey, pageKey]
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultSettings));
    } catch (e) {
      console.warn(`Failed resetting view settings for page "${pageKey}":`, e);
    }
  }, [defaultSettings, storageKey, pageKey]);

  const isVisible = useCallback(
    (key: keyof T): boolean => {
      return settings[key] !== undefined ? Boolean(settings[key]) : Boolean(defaultSettings[key]);
    },
    [settings, defaultSettings]
  );

  const hasHiddenSections = Object.keys(settings).some(
    (key) => settings[key as keyof T] === false
  );

  return {
    settings,
    toggleSetting,
    setSetting,
    resetSettings,
    isVisible,
    isSectionVisible: isVisible,
    hasHiddenSections,
  };
}
