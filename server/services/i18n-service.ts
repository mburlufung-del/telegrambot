import { storage } from '../storage.js';

// Message catalogs for different languages
const messageCatalogs: Record<string, Record<string, string>> = {
  en: {
    // Welcome messages
    'welcome.message': '🛍️ Welcome to TeleShop!\n\nChoose an option below:',
    'welcome.returning': '🛍️ Welcome back to TeleShop!',
    
    // Main menu
    'menu.listings': '📋 Listings',
    'menu.carts': '🛒 Carts', 
    'menu.orders': '📦 Orders',
    'menu.wishlist': '❤️ Wishlist',
    'menu.rating': '⭐ Rating',
    'menu.operator': '👤 Operator',
    'menu.back': '🔙 Back to Menu',
    'menu.settings': '⚙️ Settings',
    'menu.language': '🌐 Language',
    'menu.currency': '💱 Currency',
    
    // Listings
    'listings.title': '📋 *Choose Product Category:*',
    'listings.no_products': '📋 No products available at the moment.\n\nCome back later for new listings!',
    'listings.category_products': '{name} ({count} products)',
    
    // Cart
    'cart.title': '🛒 *Your Shopping Cart*',
    'cart.empty': 'Your cart is empty. Start shopping to add items!',
    'cart.total': '💰 *Total: {total}*',
    'cart.checkout_ready': '🚀 *Ready to checkout?*\nComplete your order with delivery, payment, and contact options.',
    'cart.proceed_checkout': '🛒 Proceed to Checkout',
    'cart.clear_cart': '🔄 Clear Cart',
    'cart.quantity': 'Qty: {quantity} × {price} = {total}',
    
    // Products
    'product.add_to_cart': '🛒 Add to Cart',
    'product.add_to_wishlist': '❤️ Add to Wishlist',
    'product.rate_product': '⭐ Rate Product',
    'product.stock': 'Stock: {stock}',
    'product.price': 'Price: {price}',
    'product.out_of_stock': '❌ Out of Stock',
    'product.added_to_cart': '✅ Added to cart: {product}',
    'product.added_to_wishlist': '✅ Added to wishlist: {product}',
    
    // Orders
    'orders.title': '📦 *Your Orders*',
    'orders.no_orders': 'No orders yet. Make your first purchase!',
    'orders.order_number': 'Order {number}',
    'orders.status': 'Status: {status}',
    'orders.total': 'Total: {total}',
    
    // Checkout
    'checkout.title': '🛒 *Checkout Process*',
    'checkout.delivery_method': 'Choose delivery method:',
    'checkout.payment_method': 'Choose payment method:',
    'checkout.confirm_order': '✅ Confirm Order',
    'checkout.order_confirmed': '✅ Order confirmed! Order number: {orderNumber}',
    
    // Support
    'support.title': '👤 *Customer Support*',
    'support.options': 'How can we help you?',
    'support.send_message': '💬 Send Message',
    'support.email_support': '📧 Email Support', 
    'support.faq': '❓ FAQ',
    
    // Settings
    'settings.title': '⚙️ *Settings*',
    'settings.language_title': '🌐 *Choose Language:*',
    'settings.currency_title': '💱 *Choose Currency:*',
    'settings.language_changed': '✅ Language changed to {language}',
    'settings.currency_changed': '✅ Currency changed to {currency}',
    'settings.language_current': 'Current language: {language}',
    'settings.currency_current': 'Current currency: {currency}',
    
    // Common actions
    'action.back': '🔙 Back',
    'action.cancel': '❌ Cancel',
    'action.confirm': '✅ Confirm',
    'action.continue': '➡️ Continue',
    'action.save': '💾 Save',
    
    // Error messages
    'error.general': '❌ An error occurred. Please try again.',
    'error.product_not_found': '❌ Product not found.',
    'error.out_of_stock': '❌ Product is out of stock.',
    'error.invalid_quantity': '❌ Invalid quantity.',
    
    // Success messages
    'success.cart_cleared': '✅ Cart cleared successfully.',
    'success.item_removed': '✅ Item removed from cart.',
    'success.order_placed': '✅ Order placed successfully!',
  },
  
  es: {
    // Welcome messages
    'welcome.message': '🛍️ ¡Bienvenido a TeleShop!\n\nElige una opción:',
    'welcome.returning': '🛍️ ¡Bienvenido de nuevo a TeleShop!',
    
    // Main menu
    'menu.listings': '📋 Productos',
    'menu.carts': '🛒 Carrito',
    'menu.orders': '📦 Pedidos',
    'menu.wishlist': '❤️ Lista de deseos',
    'menu.rating': '⭐ Valoraciones',
    'menu.operator': '👤 Operador',
    'menu.back': '🔙 Volver al Menú',
    'menu.settings': '⚙️ Configuración',
    'menu.language': '🌐 Idioma',
    'menu.currency': '💱 Moneda',
    
    // Listings
    'listings.title': '📋 *Elige Categoría de Producto:*',
    'listings.no_products': '📋 No hay productos disponibles en este momento.\n\n¡Vuelve más tarde para nuevos productos!',
    'listings.category_products': '{name} ({count} productos)',
    
    // Cart
    'cart.title': '🛒 *Tu Carrito de Compras*',
    'cart.empty': 'Tu carrito está vacío. ¡Empieza a comprar para agregar productos!',
    'cart.total': '💰 *Total: {total}*',
    'cart.checkout_ready': '🚀 *¿Listo para pagar?*\nCompleta tu pedido con opciones de entrega, pago y contacto.',
    'cart.proceed_checkout': '🛒 Proceder al Pago',
    'cart.clear_cart': '🔄 Limpiar Carrito',
    'cart.quantity': 'Cant: {quantity} × {price} = {total}',
    
    // Products
    'product.add_to_cart': '🛒 Añadir al Carrito',
    'product.add_to_wishlist': '❤️ Añadir a Lista de Deseos',
    'product.rate_product': '⭐ Valorar Producto',
    'product.stock': 'Stock: {stock}',
    'product.price': 'Precio: {price}',
    'product.out_of_stock': '❌ Sin Stock',
    'product.added_to_cart': '✅ Añadido al carrito: {product}',
    'product.added_to_wishlist': '✅ Añadido a lista de deseos: {product}',
    
    // Orders
    'orders.title': '📦 *Tus Pedidos*',
    'orders.no_orders': 'Aún no tienes pedidos. ¡Haz tu primera compra!',
    'orders.order_number': 'Pedido {number}',
    'orders.status': 'Estado: {status}',
    'orders.total': 'Total: {total}',
    
    // Checkout
    'checkout.title': '🛒 *Proceso de Pago*',
    'checkout.delivery_method': 'Elige método de entrega:',
    'checkout.payment_method': 'Elige método de pago:',
    'checkout.confirm_order': '✅ Confirmar Pedido',
    'checkout.order_confirmed': '✅ ¡Pedido confirmado! Número de pedido: {orderNumber}',
    
    // Support
    'support.title': '👤 *Atención al Cliente*',
    'support.options': '¿Cómo podemos ayudarte?',
    'support.send_message': '💬 Enviar Mensaje',
    'support.email_support': '📧 Soporte por Email',
    'support.faq': '❓ Preguntas Frecuentes',
    
    // Settings
    'settings.title': '⚙️ *Configuración*',
    'settings.language_title': '🌐 *Elegir Idioma:*',
    'settings.currency_title': '💱 *Elegir Moneda:*',
    'settings.language_changed': '✅ Idioma cambiado a {language}',
    'settings.currency_changed': '✅ Moneda cambiada a {currency}',
    'settings.language_current': 'Idioma actual: {language}',
    'settings.currency_current': 'Moneda actual: {currency}',
    
    // Common actions
    'action.back': '🔙 Atrás',
    'action.cancel': '❌ Cancelar',
    'action.confirm': '✅ Confirmar',
    'action.continue': '➡️ Continuar',
    'action.save': '💾 Guardar',
    
    // Error messages
    'error.general': '❌ Ocurrió un error. Por favor, inténtalo de nuevo.',
    'error.product_not_found': '❌ Producto no encontrado.',
    'error.out_of_stock': '❌ Producto sin stock.',
    'error.invalid_quantity': '❌ Cantidad inválida.',
    
    // Success messages
    'success.cart_cleared': '✅ Carrito limpiado exitosamente.',
    'success.item_removed': '✅ Producto eliminado del carrito.',
    'success.order_placed': '✅ ¡Pedido realizado exitosamente!',
  },
  
  fr: {
    // Welcome messages
    'welcome.message': '🛍️ Bienvenue sur TeleShop !\n\nChoisissez une option ci-dessous :',
    'welcome.returning': '🛍️ Bon retour sur TeleShop !',
    
    // Main menu
    'menu.listings': '📋 Produits',
    'menu.carts': '🛒 Panier',
    'menu.orders': '📦 Commandes',
    'menu.wishlist': '❤️ Liste de souhaits',
    'menu.rating': '⭐ Évaluations',
    'menu.operator': '👤 Opérateur',
    'menu.back': '🔙 Retour au Menu',
    'menu.settings': '⚙️ Paramètres',
    'menu.language': '🌐 Langue',
    'menu.currency': '💱 Devise',
    
    // Listings
    'listings.title': '📋 *Choisir une Catégorie de Produit :*',
    'listings.no_products': '📋 Aucun produit disponible pour le moment.\n\nRevenez plus tard pour de nouveaux produits !',
    'listings.category_products': '{name} ({count} produits)',
    
    // Cart
    'cart.title': '🛒 *Votre Panier*',
    'cart.empty': 'Votre panier est vide. Commencez vos achats pour ajouter des articles !',
    'cart.total': '💰 *Total : {total}*',
    'cart.checkout_ready': '🚀 *Prêt à commander ?*\nFinalisez votre commande avec les options de livraison, paiement et contact.',
    'cart.proceed_checkout': '🛒 Procéder au Paiement',
    'cart.clear_cart': '🔄 Vider le Panier',
    'cart.quantity': 'Qté : {quantity} × {price} = {total}',
    
    // Products
    'product.add_to_cart': '🛒 Ajouter au Panier',
    'product.add_to_wishlist': '❤️ Ajouter à la Liste de Souhaits',
    'product.rate_product': '⭐ Évaluer le Produit',
    'product.stock': 'Stock : {stock}',
    'product.price': 'Prix : {price}',
    'product.out_of_stock': '❌ Rupture de Stock',
    'product.added_to_cart': '✅ Ajouté au panier : {product}',
    'product.added_to_wishlist': '✅ Ajouté à la liste de souhaits : {product}',
    
    // Orders
    'orders.title': '📦 *Vos Commandes*',
    'orders.no_orders': 'Aucune commande pour le moment. Effectuez votre premier achat !',
    'orders.order_number': 'Commande {number}',
    'orders.status': 'Statut : {status}',
    'orders.total': 'Total : {total}',
    
    // Checkout
    'checkout.title': '🛒 *Processus de Commande*',
    'checkout.delivery_method': 'Choisir le mode de livraison :',
    'checkout.payment_method': 'Choisir le mode de paiement :',
    'checkout.confirm_order': '✅ Confirmer la Commande',
    'checkout.order_confirmed': '✅ Commande confirmée ! Numéro de commande : {orderNumber}',
    
    // Support
    'support.title': '👤 *Support Client*',
    'support.options': 'Comment pouvons-nous vous aider ?',
    'support.send_message': '💬 Envoyer un Message',
    'support.email_support': '📧 Support par Email',
    'support.faq': '❓ FAQ',
    
    // Settings
    'settings.title': '⚙️ *Paramètres*',
    'settings.language_title': '🌐 *Choisir la Langue :*',
    'settings.currency_title': '💱 *Choisir la Devise :*',
    'settings.language_changed': '✅ Langue changée pour {language}',
    'settings.currency_changed': '✅ Devise changée pour {currency}',
    'settings.language_current': 'Langue actuelle : {language}',
    'settings.currency_current': 'Devise actuelle : {currency}',
    
    // Common actions
    'action.back': '🔙 Retour',
    'action.cancel': '❌ Annuler',
    'action.confirm': '✅ Confirmer',
    'action.continue': '➡️ Continuer',
    'action.save': '💾 Sauvegarder',
    
    // Error messages
    'error.general': '❌ Une erreur s\'est produite. Veuillez réessayer.',
    'error.product_not_found': '❌ Produit non trouvé.',
    'error.out_of_stock': '❌ Produit en rupture de stock.',
    'error.invalid_quantity': '❌ Quantité invalide.',
    
    // Success messages
    'success.cart_cleared': '✅ Panier vidé avec succès.',
    'success.item_removed': '✅ Article retiré du panier.',
    'success.order_placed': '✅ Commande passée avec succès !',
  },
  
  de: {
    // Welcome messages
    'welcome.message': '🛍️ Willkommen bei TeleShop!\n\nWählen Sie eine Option unten:',
    'welcome.returning': '🛍️ Willkommen zurück bei TeleShop!',
    
    // Main menu
    'menu.listings': '📋 Produkte',
    'menu.carts': '🛒 Warenkorb',
    'menu.orders': '📦 Bestellungen',
    'menu.wishlist': '❤️ Wunschliste',
    'menu.rating': '⭐ Bewertungen',
    'menu.operator': '👤 Support',
    'menu.back': '🔙 Zurück zum Menü',
    'menu.settings': '⚙️ Einstellungen',
    'menu.language': '🌐 Sprache',
    'menu.currency': '💱 Währung',
    
    // Listings
    'listings.title': '📋 *Produktkategorie wählen:*',
    'listings.no_products': '📋 Derzeit sind keine Produkte verfügbar.\n\nKommen Sie später für neue Angebote zurück!',
    'listings.category_products': '{name} ({count} Produkte)',
    
    // Cart
    'cart.title': '🛒 *Ihr Warenkorb*',
    'cart.empty': 'Ihr Warenkorb ist leer. Beginnen Sie zu shoppen und fügen Sie Artikel hinzu!',
    'cart.total': '💰 *Gesamt: {total}*',
    'cart.checkout_ready': '🚀 *Bereit zum Bezahlen?*\nVervollständigen Sie Ihre Bestellung mit Liefer-, Zahlungs- und Kontaktoptionen.',
    'cart.proceed_checkout': '🛒 Zur Kasse gehen',
    'cart.clear_cart': '🔄 Warenkorb leeren',
    'cart.quantity': 'Menge: {quantity} × {price} = {total}',
    
    // Products
    'product.add_to_cart': '🛒 In den Warenkorb',
    'product.add_to_wishlist': '❤️ Zur Wunschliste',
    'product.rate_product': '⭐ Produkt bewerten',
    'product.stock': 'Lagerbestand: {stock}',
    'product.price': 'Preis: {price}',
    'product.out_of_stock': '❌ Nicht auf Lager',
    'product.added_to_cart': '✅ Zum Warenkorb hinzugefügt: {product}',
    'product.added_to_wishlist': '✅ Zur Wunschliste hinzugefügt: {product}',
    
    // Orders
    'orders.title': '📦 *Ihre Bestellungen*',
    'orders.no_orders': 'Noch keine Bestellungen. Tätigen Sie Ihren ersten Kauf!',
    'orders.order_number': 'Bestellung {number}',
    'orders.status': 'Status: {status}',
    'orders.total': 'Gesamt: {total}',
    
    // Checkout
    'checkout.title': '🛒 *Bestellvorgang*',
    'checkout.delivery_method': 'Liefermethode wählen:',
    'checkout.payment_method': 'Zahlungsmethode wählen:',
    'checkout.confirm_order': '✅ Bestellung bestätigen',
    'checkout.order_confirmed': '✅ Bestellung bestätigt! Bestellnummer: {orderNumber}',
    
    // Support
    'support.title': '👤 *Kundensupport*',
    'support.options': 'Wie können wir Ihnen helfen?',
    'support.send_message': '💬 Nachricht senden',
    'support.email_support': '📧 E-Mail Support',
    'support.faq': '❓ FAQ',
    
    // Settings
    'settings.title': '⚙️ *Einstellungen*',
    'settings.language_title': '🌐 *Sprache wählen:*',
    'settings.currency_title': '💱 *Währung wählen:*',
    'settings.language_changed': '✅ Sprache geändert zu {language}',
    'settings.currency_changed': '✅ Währung geändert zu {currency}',
    'settings.language_current': 'Aktuelle Sprache: {language}',
    'settings.currency_current': 'Aktuelle Währung: {currency}',
    
    // Common actions
    'action.back': '🔙 Zurück',
    'action.cancel': '❌ Abbrechen',
    'action.confirm': '✅ Bestätigen',
    'action.continue': '➡️ Weiter',
    'action.save': '💾 Speichern',
    
    // Error messages
    'error.general': '❌ Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    'error.product_not_found': '❌ Produkt nicht gefunden.',
    'error.out_of_stock': '❌ Produkt ist nicht auf Lager.',
    'error.invalid_quantity': '❌ Ungültige Menge.',
    
    // Success messages
    'success.cart_cleared': '✅ Warenkorb erfolgreich geleert.',
    'success.item_removed': '✅ Artikel aus dem Warenkorb entfernt.',
    'success.order_placed': '✅ Bestellung erfolgreich aufgegeben!',
  },
  
  nl: {
    // Welcome messages
    'welcome.message': '🛍️ Welkom bij TeleShop!\n\nKies een optie hieronder:',
    'welcome.returning': '🛍️ Welkom terug bij TeleShop!',
    
    // Main menu
    'menu.listings': '📋 Producten',
    'menu.carts': '🛒 Winkelwagen',
    'menu.orders': '📦 Bestellingen',
    'menu.wishlist': '❤️ Verlanglijst',
    'menu.rating': '⭐ Beoordelingen',
    'menu.operator': '👤 Ondersteuning',
    'menu.back': '🔙 Terug naar Menu',
    'menu.settings': '⚙️ Instellingen',
    'menu.language': '🌐 Taal',
    'menu.currency': '💱 Valuta',
    
    // Listings
    'listings.title': '📋 *Productcategorie kiezen:*',
    'listings.no_products': '📋 Momenteel zijn er geen producten beschikbaar.\n\nKom later terug voor nieuwe aanbiedingen!',
    'listings.category_products': '{name} ({count} producten)',
    
    // Cart
    'cart.title': '🛒 *Uw Winkelwagen*',
    'cart.empty': 'Uw winkelwagen is leeg. Begin met winkelen om artikelen toe te voegen!',
    'cart.total': '💰 *Totaal: {total}*',
    'cart.checkout_ready': '🚀 *Klaar om af te rekenen?*\nVoltooi uw bestelling met bezorg-, betalings- en contactopties.',
    'cart.proceed_checkout': '🛒 Doorgaan naar Afrekenen',
    'cart.clear_cart': '🔄 Winkelwagen Leegmaken',
    'cart.quantity': 'Aantal: {quantity} × {price} = {total}',
    
    // Products
    'product.add_to_cart': '🛒 Toevoegen aan Winkelwagen',
    'product.add_to_wishlist': '❤️ Toevoegen aan Verlanglijst',
    'product.rate_product': '⭐ Product Beoordelen',
    'product.stock': 'Voorraad: {stock}',
    'product.price': 'Prijs: {price}',
    'product.out_of_stock': '❌ Niet op Voorraad',
    'product.added_to_cart': '✅ Toegevoegd aan winkelwagen: {product}',
    'product.added_to_wishlist': '✅ Toegevoegd aan verlanglijst: {product}',
    
    // Orders
    'orders.title': '📦 *Uw Bestellingen*',
    'orders.no_orders': 'Nog geen bestellingen. Doe uw eerste aankoop!',
    'orders.order_number': 'Bestelling {number}',
    'orders.status': 'Status: {status}',
    'orders.total': 'Totaal: {total}',
    
    // Checkout
    'checkout.title': '🛒 *Afreken Proces*',
    'checkout.delivery_method': 'Bezorgmethode kiezen:',
    'checkout.payment_method': 'Betaalmethode kiezen:',
    'checkout.confirm_order': '✅ Bestelling Bevestigen',
    'checkout.order_confirmed': '✅ Bestelling bevestigd! Bestellingnummer: {orderNumber}',
    
    // Support
    'support.title': '👤 *Klantenservice*',
    'support.options': 'Hoe kunnen we u helpen?',
    'support.send_message': '💬 Bericht Versturen',
    'support.email_support': '📧 E-mail Ondersteuning',
    'support.faq': '❓ FAQ',
    
    // Settings
    'settings.title': '⚙️ *Instellingen*',
    'settings.language_title': '🌐 *Taal kiezen:*',
    'settings.currency_title': '💱 *Valuta kiezen:*',
    'settings.language_changed': '✅ Taal gewijzigd naar {language}',
    'settings.currency_changed': '✅ Valuta gewijzigd naar {currency}',
    'settings.language_current': 'Huidige taal: {language}',
    'settings.currency_current': 'Huidige valuta: {currency}',
    
    // Common actions
    'action.back': '🔙 Terug',
    'action.cancel': '❌ Annuleren',
    'action.confirm': '✅ Bevestigen',
    'action.continue': '➡️ Doorgaan',
    'action.save': '💾 Opslaan',
    
    // Error messages
    'error.general': '❌ Er is een fout opgetreden. Probeer het opnieuw.',
    'error.product_not_found': '❌ Product niet gevonden.',
    'error.out_of_stock': '❌ Product is niet op voorraad.',
    'error.invalid_quantity': '❌ Ongeldige hoeveelheid.',
    
    // Success messages
    'success.cart_cleared': '✅ Winkelwagen succesvol leeggemaakt.',
    'success.item_removed': '✅ Artikel verwijderd uit winkelwagen.',
    'success.order_placed': '✅ Bestelling succesvol geplaatst!',
  }
};

export class I18nService {
  private static instance: I18nService;
  private defaultLanguage = 'en';
  
  static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  /**
   * Get user's preferred language from storage
   */
  async getUserLanguage(telegramUserId: string): Promise<string> {
    try {
      const preferences = await storage.getUserPreferences(telegramUserId);
      return preferences?.languageCode || this.defaultLanguage;
    } catch (error) {
      console.error('Error getting user language:', error);
      return this.defaultLanguage;
    }
  }

  /**
   * Get localized message by key
   */
  async t(telegramUserId: string, key: string, params?: Record<string, string | number>): Promise<string> {
    const language = await this.getUserLanguage(telegramUserId);
    return this.translate(key, language, params);
  }

  /**
   * Get localized message by key and language (without user lookup)
   */
  translate(key: string, language: string = this.defaultLanguage, params?: Record<string, string | number>): string {
    const catalog = messageCatalogs[language] || messageCatalogs[this.defaultLanguage];
    let message = catalog[key] || messageCatalogs[this.defaultLanguage][key] || key;

    // Replace parameters in the message
    if (params) {
      for (const [param, value] of Object.entries(params)) {
        message = message.replace(`{${param}}`, String(value));
      }
    }

    return message;
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): Array<{code: string, name: string}> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'nl', name: 'Nederlands' }
    ];
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return !!messageCatalogs[languageCode];
  }

  /**
   * Get currency-aware price formatting
   */
  async formatPrice(telegramUserId: string, price: string | number): Promise<string> {
    try {
      const preferences = await storage.getUserPreferences(telegramUserId);
      const currencyCode = preferences?.currencyCode || 'USD';

      // Get currency info from database
      const currencies = await storage.getCurrencies();
      const currency = currencies.find(c => c.code === currencyCode);
      
      if (!currency) {
        return `$${Number(price).toFixed(2)}`;
      }

      const numPrice = Number(price);
      const formattedAmount = numPrice.toFixed(currency.decimalPlaces);
      
      return `${currency.symbol}${formattedAmount}`;
    } catch (error) {
      console.error('Error formatting price:', error);
      return `$${Number(price).toFixed(2)}`;
    }
  }

  /**
   * Get formatted product price with currency conversion
   */
  async getProductPrice(telegramUserId: string, product: any): Promise<{
    formattedPrice: string;
    originalPrice: string;
    currencyCode: string;
  }> {
    try {
      // Validate product has a price
      if (!product || typeof product.price === 'undefined' || product.price === null) {
        console.error('Invalid price format:', product?.price);
        return {
          formattedPrice: '$0.00',
          originalPrice: '0.00',
          currencyCode: 'USD'
        };
      }

      // Import currency service dynamically to avoid circular dependency
      const { currencyService } = await import('./currency-service.js');
      
      // Get user preferences
      const preferences = await storage.getUserPreferences(telegramUserId);
      const userCurrency = preferences?.currencyCode || 'USD';
      
      // Convert price if needed
      if (userCurrency === 'USD') {
        // No conversion needed
        const formattedPrice = await this.formatPrice(telegramUserId, product.price);
        return {
          formattedPrice,
          originalPrice: product.price.toString(),
          currencyCode: 'USD'
        };
      } else {
        // Convert from USD to user currency
        const priceResult = await currencyService.getProductPriceForUser(
          product.price,
          'USD',
          telegramUserId
        );
        
        return {
          formattedPrice: priceResult.formattedPrice,
          originalPrice: product.price.toString(),
          currencyCode: userCurrency
        };
      }
    } catch (error) {
      console.error('Error getting product price:', error);
      return {
        formattedPrice: '$0.00',
        originalPrice: '0.00',
        currencyCode: 'USD'
      };
    }
  }
}

export const i18n = I18nService.getInstance();