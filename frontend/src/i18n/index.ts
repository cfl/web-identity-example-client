import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'

// Load translation messages from separate JSON files
const messages = {
  en,
  fr
}

// Get browser language (first 2 characters, e.g., 'en-US' -> 'en')
const browserLanguage = navigator.language.split('-')[0]

// Get initial locale: localStorage > browser language > 'en'
const savedLocale = localStorage.getItem('preferredLocale') || 
                    (messages[browserLanguage as keyof typeof messages] ? browserLanguage : 'en')

// Create i18n instance
const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages
})

export default i18n
