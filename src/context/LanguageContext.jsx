import { createContext, useCallback, useContext, useState } from 'react'
import { getLang, setStoredLang, t as translate } from '../lib/i18n'

const LanguageContext = createContext(null)

/** Provee lengua actual, cambio manual y función t() a toda la app. */
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getLang())

  const setLang = useCallback((l) => {
    setStoredLang(l)
    setLangState(getLang())
  }, [])

  const t = useCallback((key, vars) => translate(key, vars), [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang debe usarse dentro de <LanguageProvider>')
  return ctx
}
