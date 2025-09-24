import { storage } from '../storage';

// Exchange rate data structure
interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
  expiresAt: number;
}

// Cache duration: 1 hour for exchange rates
const CACHE_DURATION_MS = 60 * 60 * 1000;

// In-memory cache for exchange rates
class ExchangeRateCache {
  private cache = new Map<string, ExchangeRates>();

  set(base: string, rates: ExchangeRates): void {
    this.cache.set(base, rates);
  }

  get(base: string): ExchangeRates | null {
    const cached = this.cache.get(base);
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(base);
      return null;
    }
    
    return cached;
  }

  clear(): void {
    this.cache.clear();
  }
}

export class CurrencyService {
  private cache = new ExchangeRateCache();
  
  // Using exchangerate.host - reliable free API
  private readonly apiUrl = 'https://api.exchangerate.host/latest';
  private readonly requestTimeout = 5000; // 5 second timeout

  /**
   * Get exchange rates for a base currency
   */
  async getExchangeRates(baseCurrency: string): Promise<ExchangeRates> {
    // Normalize currency code
    baseCurrency = baseCurrency.toUpperCase();
    
    // Check if currency is supported
    const isSupported = await this.isCurrencySupported(baseCurrency);
    if (!isSupported) {
      console.warn(`Currency ${baseCurrency} is not supported, using fallback rates`);
      return this.getFallbackRates(baseCurrency);
    }

    // Check cache first
    const cached = this.cache.get(baseCurrency);
    if (cached) {
      return cached;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      const response = await fetch(`${this.apiUrl}?base=${baseCurrency}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.rates || !data.success) {
        throw new Error('Invalid response format from exchange rate API');
      }

      const rates: ExchangeRates = {
        base: baseCurrency,
        rates: data.rates,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION_MS
      };

      // Cache the rates
      this.cache.set(baseCurrency, rates);
      
      return rates;
    } catch (error) {
      console.error(`Failed to fetch exchange rates for ${baseCurrency}:`, error);
      
      // Return fallback rates if API fails
      return this.getFallbackRates(baseCurrency);
    }
  }

  /**
   * Convert amount from one currency to another with fallback indication
   */
  async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<{ amount: number; fallbackUsed: boolean }> {
    // Normalize currency codes
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();
    
    // Same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return { amount, fallbackUsed: false };
    }

    // Validate currencies are supported
    const fromSupported = await this.isCurrencySupported(fromCurrency);
    const toSupported = await this.isCurrencySupported(toCurrency);
    
    if (!fromSupported || !toSupported) {
      console.warn(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
      return { amount, fallbackUsed: true };
    }

    try {
      // Get exchange rates for the base currency
      const rates = await this.getExchangeRates(fromCurrency);
      
      // Get conversion rate to target currency
      const rate = rates.rates[toCurrency];
      
      if (!rate) {
        console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
        return { amount, fallbackUsed: true };
      }

      const convertedAmount = amount * rate;
      
      // Check if we used fallback rates
      const fallbackUsed = rates.expiresAt - rates.timestamp < CACHE_DURATION_MS;
      
      return { amount: convertedAmount, fallbackUsed };
    } catch (error) {
      console.error(`Currency conversion failed from ${fromCurrency} to ${toCurrency}:`, error);
      
      // Return original amount with fallback indication
      return { amount, fallbackUsed: true };
    }
  }

  /**
   * Convert a price string with proper decimal formatting
   */
  async convertPrice(
    price: string, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<{ price: string; fallbackUsed: boolean }> {
    const numericPrice = parseFloat(price);
    
    if (isNaN(numericPrice)) {
      console.error(`Invalid price format: ${price}`);
      return { price, fallbackUsed: true };
    }

    const conversion = await this.convertCurrency(numericPrice, fromCurrency, toCurrency);
    
    // Get target currency decimal places
    const targetCurrency = await storage.getCurrency(toCurrency.toUpperCase());
    const decimalPlaces = targetCurrency?.decimalPlaces ?? 2;
    
    // Format with correct decimal places
    const formattedPrice = conversion.amount.toFixed(decimalPlaces);
    
    return { price: formattedPrice, fallbackUsed: conversion.fallbackUsed };
  }

  /**
   * Get formatted price with currency symbol and proper decimals
   */
  async getFormattedPrice(
    price: string,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ formattedPrice: string; fallbackUsed: boolean }> {
    const conversion = await this.convertPrice(price, fromCurrency, toCurrency);
    const currency = await storage.getCurrency(toCurrency.toUpperCase());
    
    let formattedPrice: string;
    if (currency) {
      formattedPrice = `${currency.symbol}${conversion.price}`;
    } else {
      formattedPrice = `${conversion.price} ${toCurrency.toUpperCase()}`;
    }
    
    return { formattedPrice, fallbackUsed: conversion.fallbackUsed };
  }

  /**
   * Get user's preferred currency or fallback to default
   */
  async getUserCurrency(telegramUserId: string): Promise<string> {
    try {
      return await storage.getUserCurrency(telegramUserId);
    } catch (error) {
      console.error('Failed to get user currency:', error);
      return 'USD'; // Fallback to USD
    }
  }

  /**
   * Convert product price to user's preferred currency
   */
  async getProductPriceForUser(
    productPrice: string,
    baseCurrency: string,
    telegramUserId: string
  ): Promise<{ formattedPrice: string; fallbackUsed: boolean }> {
    const userCurrency = await this.getUserCurrency(telegramUserId);
    return await this.getFormattedPrice(productPrice, baseCurrency, userCurrency);
  }

  /**
   * Get fallback exchange rates when API is unavailable
   * Uses USD as intermediate currency for cross-rate calculations
   */
  private getFallbackRates(baseCurrency: string): ExchangeRates {
    // Static fallback rates (USD base) - update these periodically
    const fallbackRatesUSD = {
      USD: 1.0,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      CNY: 6.45,
      CAD: 1.25,
      AUD: 1.35,
      CHF: 0.92,
      RUB: 75.0,
      BRL: 5.2
    };

    let rates: Record<string, number>;

    if (baseCurrency === 'USD') {
      rates = fallbackRatesUSD;
    } else {
      // Use USD as intermediate currency for cross-rate calculations
      const baseRate = fallbackRatesUSD[baseCurrency as keyof typeof fallbackRatesUSD];
      
      if (!baseRate) {
        // For unknown base currencies, create minimal rates using USD=1
        console.warn(`Unknown base currency ${baseCurrency}, creating minimal fallback rates`);
        rates = { 
          [baseCurrency]: 1.0,
          'USD': 1.0 // Assume parity with USD as last resort
        };
        
        // Add other major currencies at USD rates
        for (const [currency, rate] of Object.entries(fallbackRatesUSD)) {
          if (currency !== 'USD') {
            rates[currency] = rate; // Use USD-based rate directly
          }
        }
      } else {
        // Convert all USD-based rates to the new base currency
        rates = {};
        for (const [currency, rate] of Object.entries(fallbackRatesUSD)) {
          rates[currency] = rate / baseRate;
        }
      }
    }

    return {
      base: baseCurrency,
      rates,
      timestamp: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000) // Fallback rates expire in 5 minutes
    };
  }

  /**
   * Clear the exchange rate cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if currency conversion is supported
   */
  async isCurrencySupported(currencyCode: string): Promise<boolean> {
    try {
      const currency = await storage.getCurrency(currencyCode);
      return currency?.isActive === true;
    } catch (error) {
      console.error(`Error checking currency support for ${currencyCode}:`, error);
      return false;
    }
  }

  /**
   * Get all supported currency codes
   */
  async getSupportedCurrencies(): Promise<string[]> {
    try {
      const currencies = await storage.getActiveCurrencies();
      return currencies.map(c => c.code);
    } catch (error) {
      console.error('Error getting supported currencies:', error);
      return ['USD']; // Fallback
    }
  }
}

// Singleton instance
export const currencyService = new CurrencyService();