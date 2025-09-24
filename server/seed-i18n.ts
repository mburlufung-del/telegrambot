import { storage } from './storage';

export async function seedLanguagesAndCurrencies() {
  try {
    // Seed default languages
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English', isActive: true, isDefault: true },
      { code: 'es', name: 'Spanish', nativeName: 'Español', isActive: true, isDefault: false },
      { code: 'fr', name: 'French', nativeName: 'Français', isActive: true, isDefault: false },
      { code: 'de', name: 'German', nativeName: 'Deutsch', isActive: true, isDefault: false },
      { code: 'it', name: 'Italian', nativeName: 'Italiano', isActive: true, isDefault: false },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português', isActive: true, isDefault: false },
      { code: 'ru', name: 'Russian', nativeName: 'Русский', isActive: true, isDefault: false },
      { code: 'zh', name: 'Chinese', nativeName: '中文', isActive: true, isDefault: false },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', isActive: true, isDefault: false },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', isActive: true, isDefault: false },
    ];

    // Seed default currencies
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isActive: true, isDefault: true },
      { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isActive: true, isDefault: false },
      { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, isActive: true, isDefault: false },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, isActive: true, isDefault: false },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, isActive: true, isDefault: false },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, isActive: true, isDefault: false },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, isActive: true, isDefault: false },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isActive: true, isDefault: false },
      { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimalPlaces: 2, isActive: true, isDefault: false },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2, isActive: true, isDefault: false },
    ];

    // Insert languages if they don't exist
    for (const lang of languages) {
      try {
        await storage.createLanguage(lang);
        console.log(`✓ Seeded language: ${lang.name} (${lang.code})`);
      } catch (error: any) {
        if (error.message?.includes('duplicate key') || error.code === '23505') {
          console.log(`- Language ${lang.code} already exists`);
        } else {
          console.error(`Failed to seed language ${lang.code}:`, error);
        }
      }
    }

    // Insert currencies if they don't exist
    for (const currency of currencies) {
      try {
        await storage.createCurrency(currency);
        console.log(`✓ Seeded currency: ${currency.name} (${currency.code})`);
      } catch (error: any) {
        if (error.message?.includes('duplicate key') || error.code === '23505') {
          console.log(`- Currency ${currency.code} already exists`);
        } else {
          console.error(`Failed to seed currency ${currency.code}:`, error);
        }
      }
    }

    console.log('✅ I18n seed data completed');
  } catch (error) {
    console.error('❌ Failed to seed i18n data:', error);
    throw error;
  }
}