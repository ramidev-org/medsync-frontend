import React, { createContext, ReactNode, useContext, useState } from "react";
import { ar } from "./ar";
import { en } from "./en";

type LanguageCode = "en" | "ar";
type TranslationKeys = string; // allow any string key

type LocalizationContextType = {
  locale: LanguageCode;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
  setLanguage: (lang: LanguageCode) => void;
};

const resources: Record<LanguageCode, Record<string, string>> = { en, ar };

const LocalizationContext = createContext<LocalizationContextType>({
  locale: "en",
  t: (key) => key, // fallback: return key itself
  setLanguage: () => {},
});

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<LanguageCode>("en");

  const t = (
    key: TranslationKeys,
    params?: Record<string, string | number>
  ) => {
    // Get translation or fallback to key
    let translation = resources[locale][key] ?? key;

    // Replace any params like {amount} or {name}
    if (params) {
      Object.keys(params).forEach((k) => {
        translation = translation.replace(`{${k}}`, String(params[k]));
      });
    }

    return translation;
  };

  return (
    <LocalizationContext.Provider value={{ locale, t, setLanguage: setLocale }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => useContext(LocalizationContext);
